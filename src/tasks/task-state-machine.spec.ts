import { TaskStatus } from '@prisma/client';
import {
  validateTaskTransition,
  assertValidTaskTransition,
} from './task-state-machine';
import { BadRequestException } from '@nestjs/common';

describe('TaskStateMachine', () => {
  it('should allow valid transitions', () => {
    expect(validateTaskTransition(TaskStatus.BACKLOG, TaskStatus.PENDING)).toBe(true);
    expect(validateTaskTransition(TaskStatus.PENDING, TaskStatus.IN_PROGRESS)).toBe(true);
    expect(validateTaskTransition(TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED)).toBe(true);
    expect(validateTaskTransition(TaskStatus.PENDING, TaskStatus.SKIPPED)).toBe(true);
    expect(validateTaskTransition(TaskStatus.PENDING, TaskStatus.ABANDONED)).toBe(true);
    expect(validateTaskTransition(TaskStatus.PENDING, TaskStatus.MISSED)).toBe(true);
    expect(validateTaskTransition(TaskStatus.MISSED, TaskStatus.RESCHEDULED)).toBe(true);
    expect(validateTaskTransition(TaskStatus.SKIPPED, TaskStatus.RESCHEDULED)).toBe(true);
    expect(validateTaskTransition(TaskStatus.RESCHEDULED, TaskStatus.PENDING)).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(validateTaskTransition(TaskStatus.COMPLETED, TaskStatus.PENDING)).toBe(false);
    expect(validateTaskTransition(TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS)).toBe(false);
    expect(validateTaskTransition(TaskStatus.ABANDONED, TaskStatus.COMPLETED)).toBe(false);
    expect(validateTaskTransition(TaskStatus.BACKLOG, TaskStatus.COMPLETED)).toBe(false);
  });

  it('assertValidTaskTransition should throw BadRequestException for invalid transition', () => {
    expect(() =>
      assertValidTaskTransition(TaskStatus.COMPLETED, TaskStatus.PENDING),
    ).toThrow(BadRequestException);
  });
});
