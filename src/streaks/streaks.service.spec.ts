import { StreaksService } from './streaks.service';

describe('StreaksService', () => {
  let streaksService: StreaksService;
  let mockPrisma: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      userStats: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    mockEventEmitter = {
      emit: jest.fn(),
    };
    streaksService = new StreaksService(mockPrisma, mockEventEmitter);
  });

  describe('breakStreak', () => {
    it('should reset current streak to 0 and emit STREAK_BROKEN if previous streak > 0', async () => {
      mockPrisma.userStats.findUnique.mockResolvedValue({ current_streak: 5, longest_streak: 10 });
      mockPrisma.userStats.upsert.mockResolvedValue({ current_streak: 0, longest_streak: 10 });

      const res = await streaksService.breakStreak('user-1', 'arc-1', 'Skipped task');

      expect(mockPrisma.userStats.upsert).toHaveBeenCalledWith({
        where: { arc_id: 'arc-1' },
        create: expect.objectContaining({ current_streak: 0 }),
        update: expect.objectContaining({ current_streak: 0 }),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'streak.broken',
        expect.objectContaining({ previousStreak: 5 }),
      );
      expect(res.current_streak).toBe(0);
    });
  });

  describe('recordSuccessfulDay', () => {
    it('should increment current streak and update longest streak if current exceeds it', async () => {
      mockPrisma.userStats.findUnique.mockResolvedValue({ current_streak: 6, longest_streak: 6 });
      mockPrisma.userStats.upsert.mockResolvedValue({ current_streak: 7, longest_streak: 7 });

      const res = await streaksService.recordSuccessfulDay('user-1', 'arc-1', '2026-09-02');

      expect(mockPrisma.userStats.upsert).toHaveBeenCalledWith({
        where: { arc_id: 'arc-1' },
        create: expect.objectContaining({ current_streak: 1 }),
        update: expect.objectContaining({ current_streak: 7, longest_streak: 7 }),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'streak.milestone',
        expect.objectContaining({ milestone: 7 }),
      );
    });

    it('should preserve longest streak when current streak is lower', async () => {
      mockPrisma.userStats.findUnique.mockResolvedValue({ current_streak: 2, longest_streak: 15 });
      mockPrisma.userStats.upsert.mockResolvedValue({ current_streak: 3, longest_streak: 15 });

      await streaksService.recordSuccessfulDay('user-1', 'arc-1', '2026-09-02');

      expect(mockPrisma.userStats.upsert).toHaveBeenCalledWith({
        where: { arc_id: 'arc-1' },
        create: expect.objectContaining({ current_streak: 1 }),
        update: expect.objectContaining({ current_streak: 3, longest_streak: 15 }),
      });
    });
  });
});
