import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '../common/constants/events';
import { AccountabilityRuleEngine, UserBehaviorMetrics } from './rule-engine';

@Injectable()
export class AccountabilityService {
  private readonly logger = new Logger(AccountabilityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Analyzes actual behavior data and creates findings & behavioral tags.
   */
  async evaluateUser(userId: string, arcId: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { arc_id: arcId },
    });

    const tasks = await this.prisma.task.findMany({
      where: { arc_id: arcId },
      include: { events: true },
    });

    // Find max reschedules on a single task chain
    let maxReschedules = 0;
    for (const t of tasks) {
      const reschedules = t.events.filter((e) => e.event_type === 'TASK_RESCHEDULED').length;
      if (reschedules > maxReschedules) maxReschedules = reschedules;
    }

    // Recent skips count in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSkips = await this.prisma.taskEvent.count({
      where: {
        user_id: userId,
        event_type: 'TASK_SKIPPED',
        occurred_at: { gte: sevenDaysAgo },
      },
    });

    const githubVerifiedCount = tasks.filter(
      (t) => t.verification_status === 'VERIFIED',
    ).length;

    const metrics: UserBehaviorMetrics = {
      userId,
      arcId,
      totalCompleted: stats?.total_completed || 0,
      totalSkipped: stats?.total_skipped || 0,
      totalAbandoned: stats?.total_abandoned || 0,
      currentStreak: stats?.current_streak || 0,
      deepWorkMinutes: stats?.total_deep_work_minutes || 0,
      githubVerifiedTasks: githubVerifiedCount,
      maxReschedulesOnSingleTask: maxReschedules,
      recentSkipsCount: recentSkips,
    };

    const findings = AccountabilityRuleEngine.evaluate(metrics);

    const savedFindings = [];
    const assignedTags = [];

    for (const f of findings) {
      const finding = await this.prisma.accountabilityFinding.create({
        data: {
          user_id: userId,
          arc_id: arcId,
          type: f.type,
          severity: f.severity,
          facts: JSON.stringify(f.facts),
          message: f.message,
        },
      });
      savedFindings.push(finding);

      if (f.tagToAssign) {
        const tag = await this.prisma.accountabilityTag.upsert({
          where: {
            user_id_tag: {
              user_id: userId,
              tag: f.tagToAssign,
            },
          },
          create: {
            user_id: userId,
            tag: f.tagToAssign,
            evidence: JSON.stringify(f.facts),
            active: true,
          },
          update: {
            active: true,
            evidence: JSON.stringify(f.facts),
          },
        });
        assignedTags.push(tag);

        this.eventEmitter.emit(DOMAIN_EVENTS.TAG_ASSIGNED, {
          userId,
          tag: f.tagToAssign,
          facts: f.facts,
        });
      }
    }

    return {
      findings: savedFindings,
      assignedTags,
    };
  }

  async listTags(userId: string) {
    return this.prisma.accountabilityTag.findMany({
      where: { user_id: userId, active: true },
      orderBy: { assigned_at: 'desc' },
    });
  }

  async listFindings(userId: string, arcId: string) {
    return this.prisma.accountabilityFinding.findMany({
      where: { user_id: userId, arc_id: arcId },
      orderBy: { created_at: 'desc' },
    });
  }
}
