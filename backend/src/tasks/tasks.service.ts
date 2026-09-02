import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TaskRevisionsService } from '../task-revisions/task-revisions.service';
import { ScoringService } from '../scoring/scoring.service';
import { StreaksService } from '../streaks/streaks.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '../common/constants/events';
import { addDaysToDateString } from '../common/utils/timezone';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { SkipTaskDto } from './dto/skip-task.dto';
import { AbandonTaskDto } from './dto/abandon-task.dto';
import { RescheduleTaskDto } from './dto/reschedule-task.dto';
import {
  TaskStatus,
  ChangeActor,
  TaskOrigin,
  VerificationStatus,
  DependencyType,
} from '@prisma/client';
import { assertValidTaskTransition } from './task-state-machine';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taskRevisionsService: TaskRevisionsService,
    private readonly scoringService: ScoringService,
    private readonly streaksService: StreaksService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Creates a task and its initial revision.
   */
  async createTask(userId: string, dto: CreateTaskDto) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: dto.arc_id },
    });
    if (!arc || arc.user_id !== userId) {
      throw new ForbiddenException({
        code: 'ARC_ACCESS_DENIED',
        message: 'Arc does not belong to the user or does not exist',
      });
    }

    const task = await this.prisma.task.create({
      data: {
        user_id: userId,
        arc_id: dto.arc_id,
        title: dto.title,
        description: dto.description || null,
        category_id: dto.category_id,
        estimated_minutes: dto.estimated_minutes ?? 30,
        difficulty: dto.difficulty ?? 1,
        priority: dto.priority ?? 'MEDIUM',
        scheduled_date: dto.scheduled_date || null,
        scheduled_start: dto.scheduled_start || null,
        scheduled_end: dto.scheduled_end || null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        status: dto.status ?? TaskStatus.BACKLOG,
        origin: dto.origin ?? TaskOrigin.USER,
        verification_type: dto.verification_type ?? 'MANUAL',
        verification_status: VerificationStatus.UNVERIFIED,
        source_document_id: dto.source_document_id || null,
        source_section_id: dto.source_section_id || null,
      },
    });

    // Handle dependencies if provided
    if (dto.depends_on_task_ids && dto.depends_on_task_ids.length > 0) {
      for (const depId of dto.depends_on_task_ids) {
        await this.prisma.taskDependency.create({
          data: {
            task_id: task.id,
            depends_on_task_id: depId,
            type: DependencyType.BLOCKING,
          },
        });
      }
    }

    // Create initial revision v1
    const revisionActor =
      dto.origin === TaskOrigin.AI ? ChangeActor.AI : ChangeActor.USER;
    const revision = await this.taskRevisionsService.createRevision({
      taskId: task.id,
      title: task.title,
      description: task.description,
      categoryId: task.category_id,
      estimatedMinutes: task.estimated_minutes,
      difficulty: task.difficulty,
      priority: task.priority,
      changedBy: revisionActor,
      changeSummary: 'Initial creation',
    });

    // Create immutable TaskEvent
    await this.prisma.taskEvent.create({
      data: {
        task_id: task.id,
        user_id: userId,
        from_status: null,
        to_status: task.status,
        event_type: 'TASK_CREATED',
        actor: revisionActor,
      },
    });

    this.eventEmitter.emit(DOMAIN_EVENTS.TASK_CREATED, {
      userId,
      arcId: task.arc_id,
      taskId: task.id,
    });

    return this.getTaskById(userId, task.id);
  }

  /**
   * Retrieves a task by ID ensuring ownership.
   */
  async getTaskById(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        category: true,
        dependencies: { include: { depends_on: true } },
        dependent_tasks: { include: { task: true } },
        revisions: { orderBy: { version: 'desc' } },
        events: { orderBy: { occurred_at: 'desc' } },
      },
    });

    if (!task) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: `Task ${taskId} not found`,
      });
    }

    if (task.user_id !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not own this task',
      });
    }

    return task;
  }

  /**
   * Lists tasks for a user, optionally filtered by arc, date, and status.
   */
  async listTasks(
    userId: string,
    filters?: {
      arcId?: string;
      date?: string;
      status?: TaskStatus;
      categoryId?: string;
    },
  ) {
    return this.prisma.task.findMany({
      where: {
        user_id: userId,
        ...(filters?.arcId ? { arc_id: filters.arcId } : {}),
        ...(filters?.date ? { scheduled_date: filters.date } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.categoryId ? { category_id: filters.categoryId } : {}),
      },
      include: {
        category: true,
        dependencies: true,
      },
      orderBy: [{ scheduled_start: 'asc' }, { created_at: 'asc' }],
    });
  }

  /**
   * Updates a task. If core definition fields change, records a new revision.
   */
  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.getTaskById(userId, taskId);

    if (dto.status && dto.status !== task.status) {
      assertValidTaskTransition(task.status, dto.status);
    }

    const definitionChanged =
      (dto.title !== undefined && dto.title !== task.title) ||
      (dto.description !== undefined && dto.description !== task.description) ||
      (dto.category_id !== undefined && dto.category_id !== task.category_id) ||
      (dto.estimated_minutes !== undefined &&
        dto.estimated_minutes !== task.estimated_minutes) ||
      (dto.difficulty !== undefined && dto.difficulty !== task.difficulty) ||
      (dto.priority !== undefined && dto.priority !== task.priority);

    if (definitionChanged) {
      await this.taskRevisionsService.createRevision({
        taskId: task.id,
        title: dto.title ?? task.title,
        description: dto.description ?? task.description,
        categoryId: dto.category_id ?? task.category_id,
        estimatedMinutes: dto.estimated_minutes ?? task.estimated_minutes,
        difficulty: dto.difficulty ?? task.difficulty,
        priority: dto.priority ?? task.priority,
        changedBy: ChangeActor.USER,
        changeSummary: 'User update',
      });
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        category_id: dto.category_id,
        estimated_minutes: dto.estimated_minutes,
        actual_minutes: dto.actual_minutes,
        difficulty: dto.difficulty,
        priority: dto.priority,
        scheduled_date: dto.scheduled_date,
        scheduled_start: dto.scheduled_start,
        scheduled_end: dto.scheduled_end,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        status: dto.status,
        verification_type: dto.verification_type,
        user_modified: definitionChanged ? true : undefined,
      },
    });

    await this.prisma.taskEvent.create({
      data: {
        task_id: taskId,
        user_id: userId,
        from_status: task.status,
        to_status: updated.status,
        event_type: 'TASK_UPDATED',
        actor: ChangeActor.USER,
        metadata: JSON.stringify(dto),
      },
    });

    this.eventEmitter.emit(DOMAIN_EVENTS.TASK_UPDATED, {
      userId,
      arcId: task.arc_id,
      taskId,
    });

    return this.getTaskById(userId, taskId);
  }

  /**
   * Completes a task, triggers authoritative scoring and updates ArcDay.
   */
  async completeTask(userId: string, taskId: string, dto?: CompleteTaskDto) {
    const task = await this.getTaskById(userId, taskId);

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException({
        code: 'TASK_ALREADY_COMPLETED',
        message: 'Task has already been completed.',
      });
    }

    assertValidTaskTransition(task.status, TaskStatus.COMPLETED);

    const actualMinutes = dto?.actual_minutes ?? task.estimated_minutes;

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        actual_minutes: actualMinutes,
      },
    });

    const taskEvent = await this.prisma.taskEvent.create({
      data: {
        task_id: taskId,
        user_id: userId,
        from_status: task.status,
        to_status: TaskStatus.COMPLETED,
        event_type: 'TASK_COMPLETED',
        actor: ChangeActor.USER,
        metadata: dto ? JSON.stringify(dto) : undefined,
      },
    });

    // Authoritative scoring calculation
    const points = this.scoringService.calculateTaskCompletionPoints(task);
    const { scoreEvent } = await this.scoringService.applyScoreDelta({
      userId,
      arcId: task.arc_id,
      taskEventId: taskEvent.id,
      delta: points,
      reason: `Task completed: ${task.title}`,
    });

    // Update user stats total_completed
    await this.prisma.userStats.update({
      where: { arc_id: task.arc_id },
      data: {
        total_completed: { increment: 1 },
      },
    });

    // Update ArcDay aggregation if scheduled_date is set
    if (task.scheduled_date) {
      await this.prisma.arcDay.upsert({
        where: {
          arc_id_date: {
            arc_id: task.arc_id,
            date: task.scheduled_date,
          },
        },
        create: {
          arc_id: task.arc_id,
          date: task.scheduled_date,
          completed_tasks: 1,
          completed_minutes: actualMinutes,
          score_delta: points,
        },
        update: {
          completed_tasks: { increment: 1 },
          completed_minutes: { increment: actualMinutes },
          score_delta: { increment: points },
        },
      });
    }

    this.eventEmitter.emit(DOMAIN_EVENTS.TASK_COMPLETED, {
      userId,
      arcId: task.arc_id,
      taskId: task.id,
      points,
    });

    return {
      task: updatedTask,
      scoreDelta: points,
      scoreEventId: scoreEvent.id,
    };
  }

  /**
   * Skips a task with exact commitment phrase validation, applies penalty,
   * breaks current streak, and schedules next occurrence for next day.
   */
  async skipTask(userId: string, taskId: string, dto: SkipTaskDto) {
    const task = await this.getTaskById(userId, taskId);

    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.SKIPPED ||
      task.status === TaskStatus.ABANDONED
    ) {
      throw new BadRequestException({
        code: 'TASK_ALREADY_RESOLVED',
        message: `Task is already in status ${task.status} and cannot be skipped.`,
      });
    }

    assertValidTaskTransition(task.status, TaskStatus.SKIPPED);

    // Validate reason_code
    if (dto.reason_code === 'OTHER' && (!dto.reason_text || !dto.reason_text.trim())) {
      throw new BadRequestException({
        code: 'MISSING_SKIP_REASON_TEXT',
        message: "Reason text is required when reason_code is 'OTHER'",
      });
    }

    // Validate user commitment phrase
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const expectedPhrase = (user?.commitment_phrase || 'I ACCEPT THE COST')
      .trim()
      .toLowerCase();
    const providedPhrase = (dto.commitment_phrase || '').trim().toLowerCase();

    if (providedPhrase !== expectedPhrase) {
      throw new BadRequestException({
        code: 'INVALID_COMMITMENT_PHRASE',
        message: 'Commitment phrase does not match the required phrase.',
      });
    }

    // Update original task to SKIPPED
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.SKIPPED,
      },
    });

    const taskEvent = await this.prisma.taskEvent.create({
      data: {
        task_id: taskId,
        user_id: userId,
        from_status: task.status,
        to_status: TaskStatus.SKIPPED,
        event_type: 'TASK_SKIPPED',
        reason_code: dto.reason_code,
        reason_text: dto.reason_text || null,
        actor: ChangeActor.USER,
      },
    });

    // Apply skip penalty
    const penalty = this.scoringService.getSkipPenalty();
    const { scoreEvent } = await this.scoringService.applyScoreDelta({
      userId,
      arcId: task.arc_id,
      taskEventId: taskEvent.id,
      delta: penalty,
      reason: `Task skipped: ${task.title} (${dto.reason_code})`,
    });

    // Break streak
    await this.streaksService.breakStreak(
      userId,
      task.arc_id,
      `Task skipped: ${task.title}`,
    );

    // Increment skipped count
    await this.prisma.userStats.update({
      where: { arc_id: task.arc_id },
      data: {
        total_skipped: { increment: 1 },
      },
    });

    // Create next occurrence for the next eligible day
    const nextDate = task.scheduled_date
      ? addDaysToDateString(task.scheduled_date, 1)
      : null;

    let nextOccurrence = null;
    if (nextDate) {
      nextOccurrence = await this.prisma.task.create({
        data: {
          user_id: userId,
          arc_id: task.arc_id,
          title: task.title,
          description: task.description,
          category_id: task.category_id,
          estimated_minutes: task.estimated_minutes,
          difficulty: task.difficulty,
          priority: task.priority,
          scheduled_date: nextDate,
          scheduled_start: task.scheduled_start,
          scheduled_end: task.scheduled_end,
          deadline: task.deadline,
          status: TaskStatus.PENDING,
          origin: task.origin,
          user_modified: task.user_modified,
          verification_type: task.verification_type,
          verification_status: VerificationStatus.UNVERIFIED,
          source_document_id: task.source_document_id,
          source_section_id: task.source_section_id,
          rescheduled_from_task_id: task.id,
        },
      });

      // Copy revisions over
      await this.taskRevisionsService.createRevision({
        taskId: nextOccurrence.id,
        title: nextOccurrence.title,
        description: nextOccurrence.description,
        categoryId: nextOccurrence.category_id,
        estimatedMinutes: nextOccurrence.estimated_minutes,
        difficulty: nextOccurrence.difficulty,
        priority: nextOccurrence.priority,
        changedBy: ChangeActor.SYSTEM,
        changeSummary: `Automatically rescheduled from skipped task ${task.id}`,
      });
    }

    // Update ArcDay skipped count
    if (task.scheduled_date) {
      await this.prisma.arcDay.upsert({
        where: {
          arc_id_date: {
            arc_id: task.arc_id,
            date: task.scheduled_date,
          },
        },
        create: {
          arc_id: task.arc_id,
          date: task.scheduled_date,
          skipped_tasks: 1,
          score_delta: penalty,
        },
        update: {
          skipped_tasks: { increment: 1 },
          score_delta: { increment: penalty },
        },
      });
    }

    this.eventEmitter.emit(DOMAIN_EVENTS.TASK_SKIPPED, {
      userId,
      arcId: task.arc_id,
      taskId: task.id,
      penalty,
      nextOccurrenceId: nextOccurrence?.id,
    });

    return {
      task: updatedTask,
      penalty,
      scoreEventId: scoreEvent.id,
      nextOccurrence,
    };
  }

  /**
   * Permanently abandons a task with penalty and confirmation phrase.
   */
  async abandonTask(userId: string, taskId: string, dto: AbandonTaskDto) {
    const task = await this.getTaskById(userId, taskId);

    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.ABANDONED
    ) {
      throw new BadRequestException({
        code: 'TASK_ALREADY_RESOLVED',
        message: `Task is already ${task.status} and cannot be abandoned.`,
      });
    }

    assertValidTaskTransition(task.status, TaskStatus.ABANDONED);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const expectedPhrase = (user?.commitment_phrase || 'I ACCEPT THE COST')
      .trim()
      .toLowerCase();
    const providedPhrase = (dto.commitment_phrase || '').trim().toLowerCase();

    if (providedPhrase !== expectedPhrase) {
      throw new BadRequestException({
        code: 'INVALID_COMMITMENT_PHRASE',
        message: 'Commitment phrase does not match the required phrase.',
      });
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.ABANDONED,
      },
    });

    const taskEvent = await this.prisma.taskEvent.create({
      data: {
        task_id: taskId,
        user_id: userId,
        from_status: task.status,
        to_status: TaskStatus.ABANDONED,
        event_type: 'TASK_ABANDONED',
        reason_text: dto.reason,
        actor: ChangeActor.USER,
      },
    });

    const penalty = this.scoringService.getAbandonPenalty();
    const { scoreEvent } = await this.scoringService.applyScoreDelta({
      userId,
      arcId: task.arc_id,
      taskEventId: taskEvent.id,
      delta: penalty,
      reason: `Task abandoned: ${task.title} (${dto.reason})`,
    });

    await this.prisma.userStats.update({
      where: { arc_id: task.arc_id },
      data: {
        total_abandoned: { increment: 1 },
      },
    });

    this.eventEmitter.emit(DOMAIN_EVENTS.TASK_ABANDONED, {
      userId,
      arcId: task.arc_id,
      taskId: task.id,
      penalty,
    });

    return {
      task: updatedTask,
      penalty,
      scoreEventId: scoreEvent.id,
    };
  }

  /**
   * Reschedules a task to a new date, preserving historical occurrence.
   */
  async rescheduleTask(userId: string, taskId: string, dto: RescheduleTaskDto) {
    const task = await this.getTaskById(userId, taskId);

    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.ABANDONED
    ) {
      throw new BadRequestException({
        code: 'TASK_ALREADY_RESOLVED',
        message: `Task is already ${task.status} and cannot be rescheduled.`,
      });
    }

    assertValidTaskTransition(task.status, TaskStatus.RESCHEDULED);

    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.RESCHEDULED,
      },
    });

    await this.prisma.taskEvent.create({
      data: {
        task_id: taskId,
        user_id: userId,
        from_status: task.status,
        to_status: TaskStatus.RESCHEDULED,
        event_type: 'TASK_RESCHEDULED',
        reason_text: dto.reason || null,
        actor: ChangeActor.USER,
      },
    });

    // Create the new occurrence
    const newOccurrence = await this.prisma.task.create({
      data: {
        user_id: userId,
        arc_id: task.arc_id,
        title: task.title,
        description: task.description,
        category_id: task.category_id,
        estimated_minutes: task.estimated_minutes,
        difficulty: task.difficulty,
        priority: task.priority,
        scheduled_date: dto.scheduled_date,
        scheduled_start: dto.scheduled_start || task.scheduled_start,
        scheduled_end: dto.scheduled_end || task.scheduled_end,
        deadline: task.deadline,
        status: TaskStatus.PENDING,
        origin: task.origin,
        user_modified: task.user_modified,
        verification_type: task.verification_type,
        verification_status: VerificationStatus.UNVERIFIED,
        source_document_id: task.source_document_id,
        source_section_id: task.source_section_id,
        rescheduled_from_task_id: task.id,
      },
    });

    await this.taskRevisionsService.createRevision({
      taskId: newOccurrence.id,
      title: newOccurrence.title,
      description: newOccurrence.description,
      categoryId: newOccurrence.category_id,
      estimatedMinutes: newOccurrence.estimated_minutes,
      difficulty: newOccurrence.difficulty,
      priority: newOccurrence.priority,
      changedBy: ChangeActor.USER,
      changeSummary: `Rescheduled from task ${task.id} to ${dto.scheduled_date}`,
    });

    this.eventEmitter.emit(DOMAIN_EVENTS.TASK_RESCHEDULED, {
      userId,
      arcId: task.arc_id,
      oldTaskId: task.id,
      newTaskId: newOccurrence.id,
      targetDate: dto.scheduled_date,
    });

    return {
      originalTask: task,
      rescheduledTask: newOccurrence,
    };
  }

  /**
   * Deletes a task ONLY if it is still in BACKLOG status.
   */
  async deleteTask(userId: string, taskId: string) {
    const task = await this.getTaskById(userId, taskId);

    if (task.status !== TaskStatus.BACKLOG) {
      throw new BadRequestException({
        code: 'CANNOT_DELETE_ACTIVE_TASK',
        message: 'Only tasks in BACKLOG status can be deleted. Use abandon or skip for scheduled tasks.',
      });
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true, message: `Task ${taskId} deleted successfully.` };
  }
}
