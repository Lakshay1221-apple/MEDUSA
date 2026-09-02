import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { GitDotMode } from '../activity/gitdot.engine';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: ActivityService,
  ) {}

  async getActivityGraph(userId: string, arcId?: string, mode?: GitDotMode) {
    return this.activityService.getActivityGraph(userId, arcId, mode);
  }

  /**
   * Generates the Weekly War Report summarizing performance across all dimensions.
   */
  async getWarReport(userId: string, arcId: string) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: arcId },
      include: { user_stats: true },
    });

    const tasks = await this.prisma.task.findMany({
      where: { arc_id: arcId },
      include: { category: true, events: true },
    });

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const missedTasks = tasks.filter((t) => t.status === 'MISSED').length;
    const skippedTasks = tasks.filter((t) => t.status === 'SKIPPED').length;
    const abandonedTasks = tasks.filter((t) => t.status === 'ABANDONED').length;
    const rescheduledTasks = tasks.filter((t) => t.status === 'RESCHEDULED').length;
    const totalPlanned = completedTasks + missedTasks + skippedTasks + abandonedTasks;

    const executionPercent =
      totalPlanned > 0 ? Math.round((completedTasks / totalPlanned) * 100) : 0;

    const focusSessions = await this.prisma.focusSession.findMany({
      where: { user_id: userId, status: 'COMPLETED' },
    });
    const deepWorkMinutes = focusSessions.reduce(
      (sum, s) => sum + Math.round(s.duration_seconds / 60),
      0,
    );

    const githubVerifiedCount = tasks.filter(
      (t) => t.verification_status === 'VERIFIED',
    ).length;

    // Category performance
    const categoryStats: Record<
      string,
      { name: string; completed: number; total: number }
    > = {};

    for (const t of tasks) {
      const catName = t.category?.name || 'Other';
      if (!categoryStats[catName]) {
        categoryStats[catName] = { name: catName, completed: 0, total: 0 };
      }
      categoryStats[catName].total++;
      if (t.status === 'COMPLETED') {
        categoryStats[catName].completed++;
      }
    }

    const sortedCats = Object.values(categoryStats).sort(
      (a, b) =>
        (b.completed / Math.max(1, b.total)) -
        (a.completed / Math.max(1, a.total)),
    );

    const bestCategory = sortedCats[0]?.name || 'N/A';
    const weakestCategory = sortedCats[sortedCats.length - 1]?.name || 'N/A';

    // Fetch accountability findings and tags
    const findings = await this.prisma.accountabilityFinding.findMany({
      where: { user_id: userId, arc_id: arcId },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    const tags = await this.prisma.accountabilityTag.findMany({
      where: { user_id: userId, active: true },
    });

    return {
      execution_percent: executionPercent,
      tasks_completed: completedTasks,
      tasks_missed: missedTasks,
      tasks_skipped: skippedTasks,
      tasks_rescheduled: rescheduledTasks,
      tasks_abandoned: abandonedTasks,
      deep_work_minutes: deepWorkMinutes,
      github_verifications: githubVerifiedCount,
      score: arc?.user_stats?.current_score || 0,
      current_streak: arc?.user_stats?.current_streak || 0,
      longest_streak: arc?.user_stats?.longest_streak || 0,
      best_category: bestCategory,
      weakest_category: weakestCategory,
      findings,
      tags: tags.map((t) => t.tag),
    };
  }
}
