import { ScoringService } from './scoring.service';
import { SCORING_DEFAULTS } from '../common/constants/scoring.constants';

describe('ScoringService', () => {
  let scoringService: ScoringService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockEventEmitter: any;

  beforeEach(() => {
    mockPrisma = {
      scoreEvent: {
        create: jest.fn().mockResolvedValue({ id: 'event-1', delta: 10 }),
      },
      userStats: {
        upsert: jest.fn().mockResolvedValue({ current_score: 10 }),
      },
    };
    mockConfig = {
      get: jest.fn((key, def) => def),
    };
    mockEventEmitter = {
      emit: jest.fn(),
    };

    scoringService = new ScoringService(
      mockPrisma,
      mockConfig,
      mockEventEmitter,
    );
  });

  describe('Point calculations', () => {
    it('should calculate base points with difficulty multipliers', () => {
      expect(scoringService.calculateTaskCompletionPoints({ difficulty: 1 })).toBe(10);
      expect(scoringService.calculateTaskCompletionPoints({ difficulty: 2 })).toBe(12);
      expect(scoringService.calculateTaskCompletionPoints({ difficulty: 3 })).toBe(14);
      expect(scoringService.calculateTaskCompletionPoints({ difficulty: 4 })).toBe(16);
      expect(scoringService.calculateTaskCompletionPoints({ difficulty: 5 })).toBe(20);
    });

    it('should add GitHub verification bonus points', () => {
      const points = scoringService.calculateTaskCompletionPoints({
        difficulty: 1,
        verification_type: 'GITHUB_COMMIT',
      });
      expect(points).toBe(10 + SCORING_DEFAULTS.GITHUB_VERIFICATION_POINTS);
    });

    it('should return correct habit points', () => {
      expect(scoringService.getHabitCompletionPoints()).toBe(SCORING_DEFAULTS.HABIT_POINTS);
    });

    it('should return correct skip penalty', () => {
      expect(scoringService.getSkipPenalty()).toBe(SCORING_DEFAULTS.SKIP_PENALTY);
    });

    it('should return correct abandon penalty', () => {
      expect(scoringService.getAbandonPenalty()).toBe(SCORING_DEFAULTS.ABANDON_PENALTY);
    });

    it('should return correct perfect day bonus', () => {
      expect(scoringService.getPerfectDayBonus()).toBe(SCORING_DEFAULTS.PERFECT_DAY_BONUS);
    });

    it('should calculate deep work points (1 pt per 15 min)', () => {
      expect(scoringService.calculateDeepWorkPoints(14)).toBe(0);
      expect(scoringService.calculateDeepWorkPoints(15)).toBe(1);
      expect(scoringService.calculateDeepWorkPoints(30)).toBe(2);
      expect(scoringService.calculateDeepWorkPoints(90)).toBe(6);
    });
  });

  describe('applyScoreDelta', () => {
    it('should write an immutable ScoreEvent and update UserStats atomically', async () => {
      const result = await scoringService.applyScoreDelta({
        userId: 'user-1',
        arcId: 'arc-1',
        delta: 15,
        reason: 'Task completed',
      });

      expect(mockPrisma.scoreEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-1',
          arc_id: 'arc-1',
          delta: 15,
          reason: 'Task completed',
        }),
      });

      expect(mockPrisma.userStats.upsert).toHaveBeenCalledWith({
        where: { arc_id: 'arc-1' },
        create: expect.objectContaining({ current_score: 15 }),
        update: expect.objectContaining({ current_score: { increment: 15 } }),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(result.scoreEvent.id).toBe('event-1');
    });
  });
});
