import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { TasksService } from '../src/tasks/tasks.service';
import { ScoringService } from '../src/scoring/scoring.service';
import { StreaksService } from '../src/streaks/streaks.service';
import { ArcDaysService } from '../src/arc-days/arc-days.service';
import { WorkspacesService } from '../src/workspaces/workspaces.service';
import { GithubService } from '../src/github/github.service';
import { DocumentsService } from '../src/documents/documents.service';
import { AccountabilityService } from '../src/accountability/accountability.service';
import { AchievementsService } from '../src/achievements/achievements.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PrismaService } from '../src/database/prisma.service';
import { TaskStatus, TaskOrigin, DocumentFileType, ChangeActor } from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('MEDUSA Critical Flows End-to-End Audit Suite', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let tasksService: TasksService;
  let scoringService: ScoringService;
  let streaksService: StreaksService;
  let arcDaysService: ArcDaysService;
  let workspacesService: WorkspacesService;
  let githubService: GithubService;
  let documentsService: DocumentsService;
  let accountabilityService: AccountabilityService;
  let achievementsService: AchievementsService;
  let notificationsService: NotificationsService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    tasksService = moduleRef.get(TasksService);
    scoringService = moduleRef.get(ScoringService);
    streaksService = moduleRef.get(StreaksService);
    arcDaysService = moduleRef.get(ArcDaysService);
    workspacesService = moduleRef.get(WorkspacesService);
    githubService = moduleRef.get(GithubService);
    documentsService = moduleRef.get(DocumentsService);
    accountabilityService = moduleRef.get(AccountabilityService);
    achievementsService = moduleRef.get(AchievementsService);
    notificationsService = moduleRef.get(NotificationsService);
  });

  beforeEach(() => {
    jest.spyOn(prisma.taskRevision, 'findFirst').mockResolvedValue(null as any);
    jest.spyOn(prisma.taskRevision, 'create').mockResolvedValue({ id: 'mock-rev', version: 1 } as any);
    jest.spyOn(prisma.taskRevision, 'findMany').mockResolvedValue([]);
    jest.spyOn(prisma.taskEvent, 'create').mockResolvedValue({ id: 'mock-te' } as any);
    jest.spyOn(prisma.scoreEvent, 'create').mockResolvedValue({ id: 'mock-se', delta: 10 } as any);
    jest.spyOn(prisma.arcDay, 'upsert').mockResolvedValue({ id: 'mock-ad' } as any);
    jest.spyOn(prisma.userStats, 'upsert').mockResolvedValue({ current_score: 10, current_streak: 1, longest_streak: 1 } as any);
    jest.spyOn(prisma.userStats, 'update').mockResolvedValue({} as any);
    jest.spyOn(prisma.userStats, 'findUnique').mockResolvedValue({ current_score: 10, current_streak: 1, longest_streak: 1 } as any);
    jest.spyOn(prisma.notification, 'create').mockResolvedValue({ id: 'mock-notif' } as any);
    jest.spyOn(prisma.notificationPreference, 'findUnique').mockResolvedValue(null as any);
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  describe('1. Task Lifecycle, Completion, & Double-Completion Guard', () => {
    it('should complete task, apply authoritative score, and reject duplicate completion', async () => {
      // Mock or call through service
      const mockTask = {
        id: 't-complete-1',
        user_id: 'u-1',
        arc_id: 'arc-1',
        title: 'Learn Kafka',
        status: TaskStatus.PENDING,
        difficulty: 2,
        estimated_minutes: 60,
      };

      jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(mockTask as any);
      jest.spyOn(prisma.task, 'update').mockResolvedValue({ ...mockTask, status: TaskStatus.COMPLETED } as any);
      jest.spyOn(prisma.taskEvent, 'create').mockResolvedValue({ id: 'te-1' } as any);
      jest.spyOn(prisma.scoreEvent, 'create').mockResolvedValue({ id: 'se-1', delta: 12 } as any);
      jest.spyOn(prisma.userStats, 'upsert').mockResolvedValue({ current_score: 12 } as any);
      jest.spyOn(prisma.userStats, 'update').mockResolvedValue({ total_completed: 1 } as any);
      jest.spyOn(prisma.arcDay, 'upsert').mockResolvedValue({ id: 'ad-1' } as any);

      const res = await tasksService.completeTask('u-1', 't-complete-1', { actual_minutes: 55 });
      expect(res.task.status).toBe(TaskStatus.COMPLETED);
      expect(res.scoreDelta).toBe(12);

      // Now attempt duplicate completion on already completed task
      jest.spyOn(prisma.task, 'findUnique').mockResolvedValue({ ...mockTask, status: TaskStatus.COMPLETED } as any);

      await expect(
        tasksService.completeTask('u-1', 't-complete-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Task Skip, Commitment Phrase Verification, Penalty, & Next Occurrence', () => {
    it('should validate commitment phrase, apply skip penalty, reset streak, and schedule next day occurrence', async () => {
      const mockTask = {
        id: 't-skip-1',
        user_id: 'u-1',
        arc_id: 'arc-1',
        title: 'Implement Caching',
        status: TaskStatus.PENDING,
        scheduled_date: '2026-09-02',
        category_id: 'cat-1',
        estimated_minutes: 45,
        difficulty: 2,
        priority: 'MEDIUM',
        origin: TaskOrigin.USER,
      };

      jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(mockTask as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'u-1',
        commitment_phrase: 'I ACCEPT THE COST',
      } as any);
      jest.spyOn(prisma.task, 'update').mockResolvedValue({ ...mockTask, status: TaskStatus.SKIPPED } as any);
      jest.spyOn(prisma.task, 'create').mockResolvedValue({ id: 't-skip-next', scheduled_date: '2026-09-03' } as any);
      jest.spyOn(prisma.taskEvent, 'create').mockResolvedValue({ id: 'te-skip' } as any);
      jest.spyOn(prisma.scoreEvent, 'create').mockResolvedValue({ id: 'se-skip', delta: -15 } as any);
      jest.spyOn(prisma.userStats, 'findUnique').mockResolvedValue({ current_streak: 4 } as any);
      jest.spyOn(prisma.userStats, 'upsert').mockResolvedValue({ current_streak: 0 } as any);
      jest.spyOn(prisma.userStats, 'update').mockResolvedValue({ total_skipped: 1 } as any);

      const res = await tasksService.skipTask('u-1', 't-skip-1', {
        reason_code: 'BURNOUT',
        commitment_phrase: 'i accept the cost',
      });

      expect(res.penalty).toBe(-15);
      expect(res.nextOccurrence).toBeDefined();
      expect(res.nextOccurrence.scheduled_date).toBe('2026-09-03');
    });

    it('should reject skip if commitment phrase is invalid', async () => {
      const mockTask = { id: 't-skip-2', user_id: 'u-1', status: TaskStatus.PENDING };
      jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(mockTask as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'u-1',
        commitment_phrase: 'I ACCEPT THE COST',
      } as any);

      await expect(
        tasksService.skipTask('u-1', 't-skip-2', {
          reason_code: 'BURNOUT',
          commitment_phrase: 'WRONG PHRASE',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject skip if reason_code is OTHER and reason_text is empty', async () => {
      const mockTask = { id: 't-skip-3', user_id: 'u-1', status: TaskStatus.PENDING };
      jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(mockTask as any);

      await expect(
        tasksService.skipTask('u-1', 't-skip-3', {
          reason_code: 'OTHER',
          reason_text: '   ',
          commitment_phrase: 'I ACCEPT THE COST',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. Task Abandonment & Penalty', () => {
    it('should permanently abandon task with phrase verification and apply abandon penalty', async () => {
      const mockTask = {
        id: 't-abandon-1',
        user_id: 'u-1',
        arc_id: 'arc-1',
        title: 'Deprecated Library Research',
        status: TaskStatus.PENDING,
      };

      jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(mockTask as any);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'u-1',
        commitment_phrase: 'I ACCEPT THE COST',
      } as any);
      jest.spyOn(prisma.task, 'update').mockResolvedValue({ ...mockTask, status: TaskStatus.ABANDONED } as any);
      jest.spyOn(prisma.taskEvent, 'create').mockResolvedValue({ id: 'te-abandon' } as any);
      jest.spyOn(prisma.scoreEvent, 'create').mockResolvedValue({ id: 'se-abandon', delta: -25 } as any);
      jest.spyOn(prisma.userStats, 'update').mockResolvedValue({ total_abandoned: 1 } as any);

      const res = await tasksService.abandonTask('u-1', 't-abandon-1', {
        reason: 'Library is no longer maintained',
        commitment_phrase: 'I ACCEPT THE COST',
      });

      expect(res.penalty).toBe(-25);
      expect(res.task.status).toBe(TaskStatus.ABANDONED);
    });
  });

  describe('4. AI Task Modification & Revision History Preservation', () => {
    it('should preserve original AI definition in v1 and record user edit in v2 with user_modified flag', async () => {
      const initialTask = {
        id: 't-ai-1',
        user_id: 'u-1',
        arc_id: 'arc-1',
        title: 'Study Redis',
        description: 'AI Generated',
        category_id: 'cat-1',
        estimated_minutes: 30,
        difficulty: 1,
        priority: 'MEDIUM',
        status: TaskStatus.BACKLOG,
        origin: TaskOrigin.AI,
        user_modified: false,
      };

      jest.spyOn(prisma.task, 'findUnique').mockResolvedValue(initialTask as any);
      jest.spyOn(prisma.taskRevision, 'findFirst').mockResolvedValue({ version: 1 } as any);
      jest.spyOn(prisma.taskRevision, 'create').mockResolvedValue({
        id: 'rev-2',
        task_id: 't-ai-1',
        version: 2,
        title: 'Study Redis + Build Cluster Demo',
        changed_by: ChangeActor.USER,
      } as any);
      jest.spyOn(prisma.task, 'update').mockResolvedValue({
        ...initialTask,
        title: 'Study Redis + Build Cluster Demo',
        user_modified: true,
      } as any);

      const updated = await tasksService.updateTask('u-1', 't-ai-1', {
        title: 'Study Redis + Build Cluster Demo',
        estimated_minutes: 60,
      });

      expect(prisma.taskRevision.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          version: 2,
          changed_by: ChangeActor.USER,
          title: 'Study Redis + Build Cluster Demo',
        }),
      });
    });
  });

  describe('5. Daily Closure & Idempotency', () => {
    it('should close day, award perfect day bonus on 100% completion, and remain idempotent on repeated calls', async () => {
      jest.spyOn(prisma.arc, 'findUnique').mockResolvedValue({ id: 'arc-1', user_id: 'u-1' } as any);
      jest.spyOn(prisma.arcDay, 'findUnique').mockResolvedValueOnce(null); // not closed yet
      jest.spyOn(prisma.task, 'findMany').mockResolvedValue([
        { id: 't1', status: TaskStatus.COMPLETED, estimated_minutes: 60 },
        { id: 't2', status: TaskStatus.COMPLETED, estimated_minutes: 60 },
      ] as any);
      jest.spyOn(prisma.focusSession, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.scoreEvent, 'create').mockResolvedValue({ id: 'se-perfect', delta: 20 } as any);
      jest.spyOn(prisma.userStats, 'findUnique').mockResolvedValue({ current_streak: 2, longest_streak: 2 } as any);
      jest.spyOn(prisma.userStats, 'upsert').mockResolvedValue({ current_streak: 3, longest_streak: 3 } as any);
      jest.spyOn(prisma.arcDay, 'upsert').mockResolvedValue({ id: 'ad-closed', status: 'CLOSED' } as any);

      const firstClose = await arcDaysService.closeDay('u-1', 'arc-1', '2026-09-02');
      expect(firstClose.summary.isPerfectDay).toBe(true);
      expect(firstClose.summary.perfectBonus).toBe(20);

      // Second close on already closed day
      jest.spyOn(prisma.arcDay, 'findUnique').mockResolvedValueOnce({
        id: 'ad-closed',
        status: 'CLOSED',
        planned_tasks: 2,
        completed_tasks: 2,
      } as any);

      const secondClose = await arcDaysService.closeDay('u-1', 'arc-1', '2026-09-02');
      expect((secondClose.summary as any).alreadyClosed).toBe(true);
      expect(secondClose.summary.perfectBonus).toBe(0); // No double-awarding of points!
    });
  });

  describe('6. Workspace Privacy & Non-Member Rejection', () => {
    it('should reject non-member with 403 Forbidden', async () => {
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue(null);

      await expect(
        workspacesService.getLeaderboard('intruder-id', 'ws-private'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should only return aggregate leaderboard metrics and never leak private tasks/notes', async () => {
      jest.spyOn(prisma.workspaceMember, 'findUnique').mockResolvedValue({
        workspace_id: 'ws-1',
        user_id: 'u-1',
      } as any);
      jest.spyOn(prisma.workspaceMember, 'findMany').mockResolvedValue([
        {
          user_id: 'u-1',
          user: {
            name: 'Operator 1',
            user_stats: [{ current_score: 300, current_streak: 10, total_completed: 25, total_skipped: 0 }],
          },
        },
      ] as any);

      const leaderboard = await workspacesService.getLeaderboard('u-1', 'ws-1');
      expect(leaderboard[0].name).toBe('Operator 1');
      expect(leaderboard[0].score).toBe(300);
      expect((leaderboard[0] as any).tasks).toBeUndefined();
      expect((leaderboard[0] as any).documents).toBeUndefined();
      expect((leaderboard[0] as any).skipReasons).toBeUndefined();
    });
  });

  describe('7. GitHub Verification & Reconciliation Discrepancy Flag', () => {
    it('should reconcile manual task completion lacking verified GitHub activity by marking UNVERIFIED without deleting history', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'u-1',
        github_username: null,
      } as any);
      jest.spyOn(prisma.task, 'findMany').mockResolvedValue([
        {
          id: 't-manual-gh',
          status: TaskStatus.COMPLETED,
          verification_type: 'GITHUB_COMMIT',
          verification_status: 'PENDING',
        } as any,
      ]);
      jest.spyOn(prisma.task, 'update').mockResolvedValue({ id: 't-manual-gh' } as any);

      const res = await githubService.verifyToday('u-1', 'arc-1', '2026-09-02');
      expect(res.hasActivity).toBe(false);
      expect(res.reconciledTaskIds).toContain('t-manual-gh');
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 't-manual-gh' },
        data: { verification_status: 'UNVERIFIED' },
      });
    });
  });

  describe('8. PDF / Markdown Ingestion Pipeline', () => {
    it('should parse curriculum markdown and generate structured tasks in BACKLOG with AI origin', async () => {
      jest.spyOn(prisma.arc, 'findUnique').mockResolvedValue({ id: 'arc-1', user_id: 'u-1' } as any);
      jest.spyOn(prisma.sourceDocument, 'create').mockResolvedValue({
        id: 'doc-syllabus',
        status: 'UPLOADED',
        storage_key: 'key-syl',
      } as any);
      jest.spyOn(prisma.sourceDocument, 'findUnique').mockResolvedValue({
        id: 'doc-syllabus',
        user_id: 'u-1',
        arc_id: 'arc-1',
        original_filename: 'backend_syllabus.md',
        storage_key: 'key-syl',
      } as any);
      jest.spyOn(prisma.sourceDocument, 'update').mockResolvedValue({ id: 'doc-syllabus' } as any);
      jest.spyOn(prisma.documentSection, 'create').mockResolvedValue({ id: 'sec-1' } as any);
      jest.spyOn(prisma.documentChunk, 'create').mockResolvedValue({ id: 'chunk-1' } as any);
      jest.spyOn(prisma.documentChunk, 'update').mockResolvedValue({ id: 'chunk-1' } as any);
      jest.spyOn(prisma.category, 'findMany').mockResolvedValue([{ id: 'cat-be', slug: 'BACKEND' }] as any);
      jest.spyOn(prisma.task, 'create').mockResolvedValue({ id: 't-gen-1' } as any);
      jest.spyOn(prisma.taskRevision, 'create').mockResolvedValue({ id: 'rev-gen-1' } as any);
      jest.spyOn(prisma.taskEvent, 'create').mockResolvedValue({ id: 'te-gen-1' } as any);

      await documentsService.processDocument(
        'doc-syllabus',
        '# Module 1\n## Section 1.1\nLearn Redis memory layout and string SDS allocation.',
      );

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          origin: TaskOrigin.AI,
          status: TaskStatus.BACKLOG,
          user_modified: false,
        }),
      });
    });
  });
});
