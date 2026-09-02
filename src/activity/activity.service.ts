import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GitDotEngine, GitDotMode, GitDotCell } from './gitdot.engine';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates activity data for GitDot execution graph across an Arc or user's history.
   */
  async getActivityGraph(
    userId: string,
    arcId?: string,
    mode: GitDotMode = 'EXECUTION',
  ): Promise<GitDotCell[]> {
    const arcDays = await this.prisma.arcDay.findMany({
      where: {
        arc: {
          user_id: userId,
          ...(arcId ? { id: arcId } : {}),
        },
      },
      orderBy: { date: 'asc' },
    });

    return arcDays.map((ad) =>
      GitDotEngine.calculateCell(
        {
          date: ad.date,
          plannedTasks: ad.planned_tasks,
          completedTasks: ad.completed_tasks,
          deepWorkMinutes: ad.deep_work_minutes,
          scoreDelta: ad.score_delta,
        },
        mode,
      ),
    );
  }
}
