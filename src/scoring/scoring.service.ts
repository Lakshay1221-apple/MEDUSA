import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '../common/constants/events';
import { SCORING_DEFAULTS } from '../common/constants/scoring.constants';

export interface ScoreCalculationParams {
  userId: string;
  arcId: string;
  taskEventId?: string;
  delta: number;
  reason: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Authoritative method to apply a score change.
   * Creates an immutable ScoreEvent and updates UserStats atomically.
   */
  async applyScoreDelta(params: ScoreCalculationParams) {
    const { userId, arcId, taskEventId, delta, reason, metadata } = params;

    const scoreEvent = await this.prisma.scoreEvent.create({
      data: {
        user_id: userId,
        arc_id: arcId,
        task_event_id: taskEventId || null,
        delta,
        reason,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    // Update or create UserStats atomically
    const stats = await this.prisma.userStats.upsert({
      where: { arc_id: arcId },
      create: {
        user_id: userId,
        arc_id: arcId,
        current_score: delta,
        current_streak: 0,
        longest_streak: 0,
      },
      update: {
        current_score: { increment: delta },
      },
    });

    this.eventEmitter.emit(DOMAIN_EVENTS.SCORE_UPDATED, {
      userId,
      arcId,
      delta,
      newScore: stats.current_score,
      reason,
      scoreEventId: scoreEvent.id,
    });

    return { scoreEvent, stats };
  }

  /**
   * Calculates points for a completed task based on origin, habit status, and difficulty.
   */
  calculateTaskCompletionPoints(task: {
    difficulty?: number;
    source_document_id?: string | null;
    verification_type?: string;
    actual_minutes?: number;
  }): number {
    const basePoints = this.configService.get<number>(
      'scoring.scheduledPoints',
      SCORING_DEFAULTS.SCHEDULED_POINTS,
    );

    const difficulty = task.difficulty || 1;
    const multiplier =
      SCORING_DEFAULTS.DIFFICULTY_MULTIPLIER_MAP[difficulty] || 1.0;

    let points = Math.round(basePoints * multiplier);

    if (task.verification_type && task.verification_type !== 'MANUAL') {
      const verificationBonus = this.configService.get<number>(
        'scoring.githubVerificationPoints',
        SCORING_DEFAULTS.GITHUB_VERIFICATION_POINTS,
      );
      points += verificationBonus;
    }

    return points;
  }

  /**
   * Calculates points for a habit occurrence.
   */
  getHabitCompletionPoints(): number {
    return this.configService.get<number>(
      'scoring.habitPoints',
      SCORING_DEFAULTS.HABIT_POINTS,
    );
  }

  /**
   * Returns penalty for skipping a task.
   */
  getSkipPenalty(): number {
    return this.configService.get<number>(
      'scoring.skipPenalty',
      SCORING_DEFAULTS.SKIP_PENALTY,
    );
  }

  /**
   * Returns penalty for abandoning a task.
   */
  getAbandonPenalty(): number {
    return this.configService.get<number>(
      'scoring.abandonPenalty',
      SCORING_DEFAULTS.ABANDON_PENALTY,
    );
  }

  /**
   * Returns bonus for a perfect day.
   */
  getPerfectDayBonus(): number {
    return this.configService.get<number>(
      'scoring.perfectDayBonus',
      SCORING_DEFAULTS.PERFECT_DAY_BONUS,
    );
  }

  /**
   * Calculates deep work points (e.g. 1 pt per 15 min).
   */
  calculateDeepWorkPoints(durationMinutes: number): number {
    const rate = this.configService.get<number>(
      'scoring.deepWorkPer15Min',
      SCORING_DEFAULTS.DEEP_WORK_PER_15MIN,
    );
    return Math.floor(durationMinutes / 15) * rate;
  }

  /**
   * Retrieves score history ledger for a user and arc.
   */
  async getScoreLedger(userId: string, arcId: string) {
    return this.prisma.scoreEvent.findMany({
      where: { user_id: userId, arc_id: arcId },
      orderBy: { occurred_at: 'desc' },
      include: { task_event: true },
    });
  }
}
