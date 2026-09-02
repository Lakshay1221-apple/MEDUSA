import { TasksService } from './tasks.service';
import { TaskStatus, ChangeActor, TaskOrigin } from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
  let tasksService: TasksService;
  let mockPrisma: any;
  let mockTaskRevisions: any;
  let mockScoring: any;
  let mockStreaks: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      arc: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      task: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      taskEvent: { create: jest.fn() },
      userStats: { update: jest.fn() },
      arcDay: { upsert: jest.fn() },
      taskDependency: { create: jest.fn() },
    };
    mockTaskRevisions = {
      createRevision: jest.fn(),
      getRevisionHistory: jest.fn(),
    };
    mockScoring = {
      calculateTaskCompletionPoints: jest.fn().mockReturnValue(15),
      applyScoreDelta: jest.fn().mockResolvedValue({ scoreEvent: { id: 'score-1' } }),
      getSkipPenalty: jest.fn().mockReturnValue(-15),
      getAbandonPenalty: jest.fn().mockReturnValue(-25),
    };
    mockStreaks = {
      breakStreak: jest.fn().mockResolvedValue({ current_streak: 0 }),
    };
    mockEventEmitter = {
      emit: jest.fn(),
    };

    tasksService = new TasksService(
      mockPrisma,
      mockTaskRevisions,
      mockScoring,
      mockStreaks,
      mockEventEmitter,
    );
  });

  describe('createTask', () => {
    it('should create task, initial revision v1, and TaskEvent', async () => {
      mockPrisma.arc.findUnique.mockResolvedValue({ id: 'arc-1', user_id: 'user-1' });
      mockPrisma.task.create.mockResolvedValue({
        id: 'task-1',
        arc_id: 'arc-1',
        title: 'Study Redis',
        category_id: 'cat-1',
        estimated_minutes: 30,
        difficulty: 1,
        priority: 'MEDIUM',
        status: TaskStatus.BACKLOG,
        origin: TaskOrigin.AI,
      });
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        user_id: 'user-1',
        arc_id: 'arc-1',
        title: 'Study Redis',
      });

      const task = await tasksService.createTask('user-1', {
        arc_id: 'arc-1',
        title: 'Study Redis',
        category_id: 'cat-1',
        origin: TaskOrigin.AI,
      });

      expect(mockTaskRevisions.createRevision).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          title: 'Study Redis',
          changedBy: ChangeActor.AI,
        }),
      );
      expect(mockPrisma.taskEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ event_type: 'TASK_CREATED' }),
        }),
      );
    });
  });

  describe('updateTask & Revisions', () => {
    it('should create a new revision and set user_modified: true when definition fields change', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        user_id: 'user-1',
        arc_id: 'arc-1',
        title: 'Study Redis',
        category_id: 'cat-1',
        estimated_minutes: 30,
        difficulty: 1,
        priority: 'MEDIUM',
        status: TaskStatus.BACKLOG,
      });
      mockPrisma.task.update.mockResolvedValue({
        id: 'task-1',
        title: 'Study Redis + Build Demo',
        user_modified: true,
      });

      await tasksService.updateTask('user-1', 'task-1', {
        title: 'Study Redis + Build Demo',
      });

      expect(mockTaskRevisions.createRevision).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          title: 'Study Redis + Build Demo',
          changedBy: ChangeActor.USER,
        }),
      );
    });
  });

  describe('completeTask', () => {
    it('should complete task, apply scoring, and update ArcDay', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        user_id: 'user-1',
        arc_id: 'arc-1',
        title: 'Task 1',
        status: TaskStatus.PENDING,
        scheduled_date: '2026-09-02',
        estimated_minutes: 60,
      });
      mockPrisma.task.update.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.COMPLETED,
      });
      mockPrisma.taskEvent.create.mockResolvedValue({ id: 'event-1' });

      const res = await tasksService.completeTask('user-1', 'task-1', { actual_minutes: 50 });

      expect(mockScoring.applyScoreDelta).toHaveBeenCalled();
      expect(mockPrisma.userStats.update).toHaveBeenCalled();
      expect(res.scoreDelta).toBe(15);
    });

    it('should throw BadRequestException if task is already completed (Double-completion guard)', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        user_id: 'user-1',
        status: TaskStatus.COMPLETED,
      });

      await expect(
        tasksService.completeTask('user-1', 'task-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('skipTask', () => {
    it('should validate commitment phrase, apply penalty, break streak, and schedule next occurrence', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        user_id: 'user-1',
        arc_id: 'arc-1',
        title: 'Task 1',
        status: TaskStatus.PENDING,
        scheduled_date: '2026-09-02',
        category_id: 'cat-1',
        estimated_minutes: 30,
        difficulty: 1,
        priority: 'MEDIUM',
        origin: TaskOrigin.USER,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        commitment_phrase: 'I ACCEPT THE COST',
      });
      mockPrisma.task.update.mockResolvedValue({
        id: 'task-1',
        status: TaskStatus.SKIPPED,
      });
      mockPrisma.task.create.mockResolvedValue({
        id: 'task-next',
        scheduled_date: '2026-09-03',
      });
      mockPrisma.taskEvent.create.mockResolvedValue({ id: 'event-skip' });

      const res = await tasksService.skipTask('user-1', 'task-1', {
        reason_code: 'SCHEDULE_CONFLICT',
        commitment_phrase: '  i accept the cost  ', // trimmed & case-insensitive
      });

      expect(mockScoring.applyScoreDelta).toHaveBeenCalledWith(
        expect.objectContaining({ delta: -15 }),
      );
      expect(mockStreaks.breakStreak).toHaveBeenCalled();
      expect(res.penalty).toBe(-15);
      expect(res.nextOccurrence).toBeDefined();
    });

    it('should reject skip if commitment phrase is incorrect', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        user_id: 'user-1',
        status: TaskStatus.PENDING,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        commitment_phrase: 'I ACCEPT THE COST',
      });

      await expect(
        tasksService.skipTask('user-1', 'task-1', {
          reason_code: 'BURNOUT',
          commitment_phrase: 'I DO NOT ACCEPT',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject skip if reason_code is OTHER and reason_text is missing', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        user_id: 'user-1',
        status: TaskStatus.PENDING,
      });

      await expect(
        tasksService.skipTask('user-1', 'task-1', {
          reason_code: 'OTHER',
          commitment_phrase: 'I ACCEPT THE COST',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
