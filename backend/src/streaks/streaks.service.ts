import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '../common/constants/events';

@Injectable()
export class StreaksService {
  private readonly logger = new Logger(StreaksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Resets streak to 0 (e.g. on skip or missed day closure).
   */
  async breakStreak(userId: string, arcId: string, reason: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { arc_id: arcId },
    });

    const previousStreak = stats?.current_streak || 0;

    const updated = await this.prisma.userStats.upsert({
      where: { arc_id: arcId },
      create: {
        user_id: userId,
        arc_id: arcId,
        current_streak: 0,
        longest_streak: 0,
      },
      update: {
        current_streak: 0,
      },
    });

    if (previousStreak > 0) {
      this.eventEmitter.emit(DOMAIN_EVENTS.STREAK_BROKEN, {
        userId,
        arcId,
        previousStreak,
        reason,
      });
    }

    return updated;
  }

  /**
   * Increments streak upon successful daily closure.
   */
  async recordSuccessfulDay(userId: string, arcId: string, dateStr: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { arc_id: arcId },
    });

    const currentStreak = (stats?.current_streak || 0) + 1;
    const longestStreak = Math.max(stats?.longest_streak || 0, currentStreak);

    const updated = await this.prisma.userStats.upsert({
      where: { arc_id: arcId },
      create: {
        user_id: userId,
        arc_id: arcId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: dateStr,
      },
      update: {
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: dateStr,
      },
    });

    this.eventEmitter.emit(DOMAIN_EVENTS.SCORE_UPDATED, {
      userId,
      arcId,
      currentStreak,
      longestStreak,
    });

    // Check milestones
    const milestones = [3, 7, 14, 21, 30, 50, 75, 100, 150, 365];
    if (milestones.includes(currentStreak)) {
      this.eventEmitter.emit(DOMAIN_EVENTS.STREAK_MILESTONE, {
        userId,
        arcId,
        milestone: currentStreak,
      });
    }

    return updated;
  }
}
