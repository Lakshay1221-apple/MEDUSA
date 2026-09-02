import { getDateRangeArray } from '../common/utils/timezone';

export interface SchedulerTaskInput {
  id: string;
  title: string;
  estimatedMinutes: number;
  difficulty: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  categoryId: string;
  deadline?: string | null;
  scheduledDate?: string | null;
  isPinned?: boolean;
  dependsOnTaskIds: string[];
}

export interface SchedulerArcInput {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dailyCapacityMinutes: number;
  weeklyCapacityMinutes: number;
  blackoutDates: string[];
}

export interface ScheduledPlacement {
  taskId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  reason: string;
}

export class AutoSchedulerEngine {
  /**
   * Generates a schedule plan mapping tasks to available dates within capacity and constraints.
   */
  static schedule(
    arc: SchedulerArcInput,
    tasks: SchedulerTaskInput[],
    existingDailyCommitments: Record<string, number> = {},
  ): ScheduledPlacement[] {
    const dates = getDateRangeArray(arc.startDate, arc.endDate);
    const availableDates = dates.filter((d) => !arc.blackoutDates.includes(d));

    if (availableDates.length === 0) {
      return [];
    }

    // Map daily remaining capacity
    const dailyRemainingCapacity: Record<string, number> = {};
    for (const d of availableDates) {
      const alreadyCommitted = existingDailyCommitments[d] || 0;
      dailyRemainingCapacity[d] = Math.max(0, arc.dailyCapacityMinutes - alreadyCommitted);
    }

    const placements: ScheduledPlacement[] = [];
    const scheduledTaskDates = new Map<string, string>();

    // 1. Separate pinned/overridden tasks from unplaced tasks
    const pinnedTasks = tasks.filter((t) => t.isPinned && t.scheduledDate);
    const unplacedTasks = tasks.filter((t) => !(t.isPinned && t.scheduledDate));

    // Place pinned tasks first
    for (const pt of pinnedTasks) {
      const targetDate = pt.scheduledDate!;
      if (dailyRemainingCapacity[targetDate] !== undefined) {
        dailyRemainingCapacity[targetDate] = Math.max(
          0,
          dailyRemainingCapacity[targetDate] - pt.estimatedMinutes,
        );
      }
      scheduledTaskDates.set(pt.id, targetDate);
      placements.push({
        taskId: pt.id,
        date: targetDate,
        reason: 'User pinned override',
      });
    }

    // 2. Topological sort on unplaced tasks considering dependencies
    const sortedTasks = this.topologicalSort(unplacedTasks);

    // Priority rank mapping
    const priorityWeights: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    // Sort by priority and deadline
    sortedTasks.sort((a, b) => {
      // If one has a deadline and other doesn't, deadline comes earlier
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      if (a.deadline && b.deadline && a.deadline !== b.deadline) {
        return a.deadline.localeCompare(b.deadline);
      }
      const weightA = priorityWeights[a.priority] || 2;
      const weightB = priorityWeights[b.priority] || 2;
      return weightB - weightA;
    });

    // 3. Greedy bin-packing into dates
    for (const task of sortedTasks) {
      // Find earliest date allowed by dependencies
      let minDate = availableDates[0];
      for (const depId of task.dependsOnTaskIds) {
        const depDate = scheduledTaskDates.get(depId);
        if (depDate && depDate > minDate) {
          minDate = depDate;
        }
      }

      // Find best date on or after minDate before deadline
      let placed = false;
      for (const date of availableDates) {
        if (date < minDate) continue;

        // Check deadline constraint
        if (task.deadline) {
          const deadlineDate = task.deadline.split('T')[0];
          if (date > deadlineDate) {
            break; // Exceeded deadline
          }
        }

        const remaining = dailyRemainingCapacity[date] ?? 0;
        if (remaining >= task.estimatedMinutes) {
          dailyRemainingCapacity[date] -= task.estimatedMinutes;
          scheduledTaskDates.set(task.id, date);
          placements.push({
            taskId: task.id,
            date,
            reason: `Placed via capacity allocation (remaining ${dailyRemainingCapacity[date]}m)`,
          });
          placed = true;
          break;
        }
      }

      // Fallback: If day capacity is tight, place in the date with max remaining capacity on or after minDate
      if (!placed) {
        let bestDate = availableDates.find((d) => d >= minDate) || availableDates[availableDates.length - 1];
        dailyRemainingCapacity[bestDate] = Math.max(0, (dailyRemainingCapacity[bestDate] || 0) - task.estimatedMinutes);
        scheduledTaskDates.set(task.id, bestDate);
        placements.push({
          taskId: task.id,
          date: bestDate,
          reason: 'Overflow placement (capacity exceeded)',
        });
      }
    }

    return placements;
  }

  private static topologicalSort(tasks: SchedulerTaskInput[]): SchedulerTaskInput[] {
    const taskMap = new Map<string, SchedulerTaskInput>();
    for (const t of tasks) {
      taskMap.set(t.id, t);
    }

    const visited = new Set<string>();
    const result: SchedulerTaskInput[] = [];

    function visit(taskId: string, ancestorSet: Set<string>) {
      if (visited.has(taskId)) return;
      if (ancestorSet.has(taskId)) {
        // Cycle detected, break cycle gracefully
        return;
      }
      ancestorSet.add(taskId);
      const task = taskMap.get(taskId);
      if (task) {
        for (const depId of task.dependsOnTaskIds) {
          if (taskMap.has(depId)) {
            visit(depId, new Set(ancestorSet));
          }
        }
        visited.add(taskId);
        result.push(task);
      }
    }

    for (const t of tasks) {
      if (!visited.has(t.id)) {
        visit(t.id, new Set());
      }
    }

    return result;
  }
}
