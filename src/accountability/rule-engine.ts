import { TagType, AccountabilitySeverity } from '@prisma/client';

export interface UserBehaviorMetrics {
  userId: string;
  arcId: string;
  totalCompleted: number;
  totalSkipped: number;
  totalAbandoned: number;
  currentStreak: number;
  deepWorkMinutes: number;
  githubVerifiedTasks: number;
  maxReschedulesOnSingleTask: number;
  recentSkipsCount: number; // in last 7 days
}

export interface RuleFinding {
  type: string;
  severity: AccountabilitySeverity;
  facts: Record<string, any>;
  message: string;
  tagToAssign?: TagType;
}

export class AccountabilityRuleEngine {
  /**
   * Evaluates deterministic behavioral rules against real measurable facts.
   */
  static evaluate(metrics: UserBehaviorMetrics): RuleFinding[] {
    const findings: RuleFinding[] = [];

    // Rule 1: Reschedule addiction
    if (metrics.maxReschedulesOnSingleTask >= 3) {
      findings.push({
        type: 'RESCHEDULE_PATTERN',
        severity: AccountabilitySeverity.HIGH,
        facts: {
          task_rescheduled_count: metrics.maxReschedulesOnSingleTask,
        },
        message: `RESCHEDULE LOOP DETECTED. You have rescheduled a single task ${metrics.maxReschedulesOnSingleTask} times. Stop postponing execution.`,
        tagToAssign: TagType.RESCHEDULE_ADDICT,
      });
    }

    // Rule 2: Excuse pattern (frequent skips)
    if (metrics.recentSkipsCount >= 3) {
      findings.push({
        type: 'EXCUSE_PATTERN',
        severity: AccountabilitySeverity.HIGH,
        facts: {
          skips_in_last_7_days: metrics.recentSkipsCount,
        },
        message: `EXCUSE PATTERN DETECTED. You have skipped ${metrics.recentSkipsCount} tasks in the last 7 days. Your streak was broken.`,
        tagToAssign: TagType.EXCUSE_PATTERN,
      });
    }

    // Rule 3: Task Quitter (abandoning work)
    if (metrics.totalAbandoned >= 2) {
      findings.push({
        type: 'TASK_QUITTER',
        severity: AccountabilitySeverity.CRITICAL,
        facts: {
          abandoned_count: metrics.totalAbandoned,
        },
        message: `ABANDONMENT DETECTED. You have abandoned ${metrics.totalAbandoned} tasks. Every abandoned task is a permanent penalty.`,
        tagToAssign: TagType.TASK_QUITTER,
      });
    }

    // Rule 4: Iron streak
    if (metrics.currentStreak >= 14) {
      findings.push({
        type: 'IRON_STREAK',
        severity: AccountabilitySeverity.LOW,
        facts: {
          current_streak: metrics.currentStreak,
        },
        message: `EXEMPLARY MOMENTUM. You have maintained an unbroken execution streak of ${metrics.currentStreak} days.`,
        tagToAssign: TagType.IRON_STREAK,
      });
    }

    // Rule 5: Shipper (GitHub verification consistency)
    if (metrics.githubVerifiedTasks >= 20) {
      findings.push({
        type: 'SHIPPER',
        severity: AccountabilitySeverity.LOW,
        facts: {
          github_verified_tasks: metrics.githubVerifiedTasks,
        },
        message: `SHIPPER LEVEL REACHED. You have 20+ verified GitHub delivery tasks recorded in this Arc.`,
        tagToAssign: TagType.SHIPPER,
      });
    }

    // Rule 6: Deep worker
    if (metrics.deepWorkMinutes >= 1200) {
      // 20 hours
      findings.push({
        type: 'DEEP_WORKER',
        severity: AccountabilitySeverity.LOW,
        facts: {
          deep_work_minutes: metrics.deepWorkMinutes,
        },
        message: `DEEP WORK EXECUTOR. Over 20 hours of focused deep work logged.`,
        tagToAssign: TagType.DEEP_WORKER,
      });
    }

    // Rule 7: General Executor
    if (metrics.totalCompleted >= 50 && metrics.totalSkipped === 0) {
      findings.push({
        type: 'NO_QUIT',
        severity: AccountabilitySeverity.LOW,
        facts: {
          completed: metrics.totalCompleted,
          skipped: metrics.totalSkipped,
        },
        message: `ZERO COMPROMISE. 50+ tasks completed with 0 skips recorded.`,
        tagToAssign: TagType.NO_QUIT,
      });
    }

    return findings;
  }
}
