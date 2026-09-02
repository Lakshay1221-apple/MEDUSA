import { ArcDaysService } from './arc-days.service';
import { TaskStatus } from '@prisma/client';

describe('ArcDaysService', () => {
  let arcDaysService: ArcDaysService;
  let mockPrisma: any;
  let mockScoring: any;
  let mockStreaks: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      arc: { findUnique: jest.fn().mockResolvedValue({ id: 'arc-1', user_id: 'user-1' }) },
      arcDay: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ id: 'day-1', status: 'CLOSED' }),
      },
      task: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      taskEvent: { create: jest.fn() },
      focusSession: { findMany: jest.fn().mockResolvedValue([]) },
    };
    mockScoring = {
      getPerfectDayBonus: jest.fn().mockReturnValue(20),
      applyScoreDelta: jest.fn(),
    };
    mockStreaks = {
      recordSuccessfulDay: jest.fn(),
      breakStreak: jest.fn(),
    };
    mockEventEmitter = { emit: jest.fn() };

    arcDaysService = new ArcDaysService(
      mockPrisma,
      mockScoring,
      mockStreaks,
      mockEventEmitter,
    );
  });

  describe('closeDay', () => {
    it('should award perfect day bonus and increment streak when all planned tasks are completed', async () => {
      mockPrisma.task.findMany.mockResolvedValue([
        { id: 't1', status: TaskStatus.COMPLETED, estimated_minutes: 60, actual_minutes: 60 },
        { id: 't2', status: TaskStatus.COMPLETED, estimated_minutes: 30, actual_minutes: 30 },
      ]);

      const res = await arcDaysService.closeDay('user-1', 'arc-1', '2026-09-02');

      expect(res.summary.isPerfectDay).toBe(true);
      expect(mockScoring.applyScoreDelta).toHaveBeenCalledWith(
        expect.objectContaining({ delta: 20 }),
      );
      expect(mockStreaks.recordSuccessfulDay).toHaveBeenCalled();
    });

    it('should mark leftover PENDING tasks as MISSED and break streak on incomplete day', async () => {
      mockPrisma.task.findMany
        .mockResolvedValueOnce([
          { id: 't1', status: TaskStatus.COMPLETED, estimated_minutes: 60 },
          { id: 't2', status: TaskStatus.PENDING, estimated_minutes: 30 },
        ])
        .mockResolvedValueOnce([
          { id: 't1', status: TaskStatus.COMPLETED, estimated_minutes: 60 },
          { id: 't2', status: TaskStatus.MISSED, estimated_minutes: 30 },
        ]);

      const res = await arcDaysService.closeDay('user-1', 'arc-1', '2026-09-02');

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 't2' },
        data: { status: TaskStatus.MISSED },
      });
      expect(mockStreaks.breakStreak).toHaveBeenCalled();
      expect(res.summary.missedTasks).toBe(1);
    });
  });
});
