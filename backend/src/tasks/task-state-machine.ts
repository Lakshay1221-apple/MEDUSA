import { TaskStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.BACKLOG]: [TaskStatus.PENDING],
  [TaskStatus.PENDING]: [
    TaskStatus.IN_PROGRESS,
    TaskStatus.COMPLETED,
    TaskStatus.SKIPPED,
    TaskStatus.ABANDONED,
    TaskStatus.MISSED,
    TaskStatus.BACKLOG,
    TaskStatus.RESCHEDULED,
  ],
  [TaskStatus.IN_PROGRESS]: [
    TaskStatus.COMPLETED,
    TaskStatus.SKIPPED,
    TaskStatus.ABANDONED,
    TaskStatus.PENDING,
    TaskStatus.MISSED,
    TaskStatus.RESCHEDULED,
  ],
  [TaskStatus.MISSED]: [TaskStatus.RESCHEDULED, TaskStatus.ABANDONED],
  [TaskStatus.SKIPPED]: [TaskStatus.RESCHEDULED],
  [TaskStatus.RESCHEDULED]: [TaskStatus.PENDING],
  [TaskStatus.COMPLETED]: [], // Terminal state
  [TaskStatus.ABANDONED]: [], // Terminal state
};

export function validateTaskTransition(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus,
): boolean {
  if (currentStatus === targetStatus) {
    return true;
  }
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

export function assertValidTaskTransition(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus,
): void {
  if (!validateTaskTransition(currentStatus, targetStatus)) {
    throw new BadRequestException({
      code: 'INVALID_TASK_TRANSITION',
      message: `Cannot transition task from ${currentStatus} to ${targetStatus}`,
    });
  }
}
