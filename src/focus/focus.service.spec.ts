import { FocusService } from './focus.service';
import { FocusStatus } from '@prisma/client';

describe('FocusService', () => {
  let focusService: FocusService;
  let mockPrisma: any;
  let mockScoring: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      task: { findUnique: jest.fn().mockResolvedValue({ id: 'task-1', user_id: 'user-1' }) },
      focusSession: {
        create: jest.fn().mockResolvedValue({ id: 'session-1', status: FocusStatus.ACTIVE }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userStats: { update: jest.fn() },
      arcDay: { upsert: jest.fn() },
    };
    mockScoring = {
      calculateDeepWorkPoints: jest.fn().mockReturnValue(4),
      applyScoreDelta: jest.fn(),
    };
    mockEventEmitter = { emit: jest.fn() };

    focusService = new FocusService(mockPrisma, mockScoring, mockEventEmitter);
  });

  it('should start an active focus session', async () => {
    const session = await focusService.startFocusSession('user-1', { task_id: 'task-1' });
    expect(mockPrisma.focusSession.create).toHaveBeenCalled();
    expect(session.id).toBe('session-1');
  });

  it('should complete focus session, calculate duration, and apply deep work points', async () => {
    const startedAt = new Date(Date.now() - 3600 * 1000); // 60 mins ago
    mockPrisma.focusSession.findUnique.mockResolvedValue({
      id: 'session-1',
      user_id: 'user-1',
      status: FocusStatus.ACTIVE,
      started_at: startedAt,
      task: { id: 'task-1', arc_id: 'arc-1', scheduled_date: '2026-09-02' },
    });
    mockPrisma.focusSession.update.mockResolvedValue({
      id: 'session-1',
      status: FocusStatus.COMPLETED,
      duration_seconds: 3600,
    });

    const res = await focusService.completeFocusSession('user-1', 'session-1', { duration_seconds: 3600 });

    expect(mockScoring.applyScoreDelta).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        arcId: 'arc-1',
        delta: 4,
      }),
    );
    expect(mockPrisma.userStats.update).toHaveBeenCalled();
    expect(res.status).toBe(FocusStatus.COMPLETED);
  });
});
