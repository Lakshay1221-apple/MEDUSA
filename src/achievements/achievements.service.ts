import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '../common/constants/events';

export const ACHIEVEMENT_DEFINITIONS: Record<
  string,
  { title: string; description: string; points: number }
> = {
  FIRST_TASK: {
    title: 'First Step',
    description: 'Completed your first scheduled task.',
    points: 10,
  },
  '7_DAY_STREAK': {
    title: 'Week of Iron',
    description: 'Maintained a 7-day execution streak.',
    points: 50,
  },
  '30_DAY_STREAK': {
    title: 'Monthly Unstoppable',
    description: 'Maintained a 30-day continuous streak.',
    points: 200,
  },
  '100_TASKS': {
    title: 'Centurion',
    description: 'Completed 100 tasks across all Arcs.',
    points: 150,
  },
  FIRST_GITHUB_VERIFICATION: {
    title: 'Code Verified',
    description: 'First task verified directly through GitHub activity.',
    points: 25,
  },
  DEEP_WORK_50_HOURS: {
    title: 'Deep Work Master',
    description: 'Logged 50+ hours of focused deep work sessions.',
    points: 100,
  },
  PERFECT_WEEK: {
    title: 'Flawless Execution',
    description: 'Completed 100% of planned tasks for 7 consecutive days.',
    points: 75,
  },
};

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async listUserAchievements(userId: string) {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { user_id: userId },
      orderBy: { unlocked_at: 'desc' },
    });

    return Object.entries(ACHIEVEMENT_DEFINITIONS).map(([key, def]) => {
      const unlocked = userAchievements.find((ua) => ua.achievement_key === key);
      return {
        key,
        title: def.title,
        description: def.description,
        points: def.points,
        is_unlocked: !!unlocked,
        unlocked_at: unlocked ? unlocked.unlocked_at : null,
      };
    });
  }

  /**
   * Evaluates and unlocks an achievement if not already unlocked.
   */
  async unlockAchievement(userId: string, achievementKey: string, metadata?: any) {
    if (!ACHIEVEMENT_DEFINITIONS[achievementKey]) return null;

    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        user_id_achievement_key: {
          user_id: userId,
          achievement_key: achievementKey,
        },
      },
    });

    if (existing) return existing;

    const achievement = await this.prisma.userAchievement.create({
      data: {
        user_id: userId,
        achievement_key: achievementKey,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    this.eventEmitter.emit(DOMAIN_EVENTS.ACHIEVEMENT_UNLOCKED, {
      userId,
      achievementKey,
      title: ACHIEVEMENT_DEFINITIONS[achievementKey].title,
    });

    return achievement;
  }

  @OnEvent(DOMAIN_EVENTS.TASK_COMPLETED)
  async handleTaskCompleted(event: { userId: string; arcId: string }) {
    await this.unlockAchievement(event.userId, 'FIRST_TASK');
    const stats = await this.prisma.userStats.findUnique({
      where: { arc_id: event.arcId },
    });
    if (stats && stats.total_completed >= 100) {
      await this.unlockAchievement(event.userId, '100_TASKS');
    }
  }

  @OnEvent(DOMAIN_EVENTS.STREAK_MILESTONE)
  async handleStreakMilestone(event: { userId: string; milestone: number }) {
    if (event.milestone >= 7) {
      await this.unlockAchievement(event.userId, '7_DAY_STREAK');
    }
    if (event.milestone >= 30) {
      await this.unlockAchievement(event.userId, '30_DAY_STREAK');
    }
  }

  @OnEvent(DOMAIN_EVENTS.GITHUB_VERIFIED)
  async handleGithubVerified(event: { userId: string }) {
    await this.unlockAchievement(event.userId, 'FIRST_GITHUB_VERIFICATION');
  }
}
