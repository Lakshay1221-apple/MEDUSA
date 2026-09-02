import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { StreaksService } from '../streaks/streaks.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '../common/constants/events';
import { DayStatus, TaskStatus, ChangeActor } from '@prisma/client';

@Injectable()
export class ArcDaysService {
  private readonly logger = new Logger(ArcDaysService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService,
    private readonly streaksService: StreaksService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getArcDay(userId: string, arcId: string, date: string) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: arcId },
    });
    if (!arc || arc.user_id !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Access to this arc is forbidden',
      });
    }

    let arcDay = await this.prisma.arcDay.findUnique({
      where: { arc_id_date: { arc_id: arcId, date } },
    });

    if (!arcDay) {
      arcDay = await this.prisma.arcDay.create({
        data: {
          arc_id: arcId,
          date,
        },
      });
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        arc_id: arcId,
        scheduled_date: date,
      },
      include: {
        category: true,
        dependencies: true,
      },
      orderBy: { scheduled_start: 'asc' },
    });

    const focusSessions = await this.prisma.focusSession.findMany({
      where: {
        user_id: userId,
        started_at: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        },
      },
    });

    return {
      arcDay,
      tasks,
      focusSessions,
    };
  }

  async listArcDays(userId: string, arcId: string) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: arcId },
    });
    if (!arc || arc.user_id !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Access to this arc is forbidden',
      });
    }

    return this.prisma.arcDay.findMany({
      where: { arc_id: arcId },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Authoritative daily closure.
   */
  async closeDay(userId: string, arcId: string, date: string) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: arcId },
    });
    if (!arc || arc.user_id !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Access to this arc is forbidden',
      });
    }

    const existingArcDay = await this.prisma.arcDay.findUnique({
      where: { arc_id_date: { arc_id: arcId, date } },
    });

    if (existingArcDay && existingArcDay.status === DayStatus.CLOSED) {
      return {
        arcDay: existingArcDay,
        summary: {
          plannedTasks: existingArcDay.planned_tasks,
          completedTasks: existingArcDay.completed_tasks,
          missedTasks: existingArcDay.missed_tasks,
          skippedTasks: existingArcDay.skipped_tasks,
          abandonedTasks: existingArcDay.abandoned_tasks,
          plannedMinutes: existingArcDay.planned_minutes,
          completedMinutes: existingArcDay.completed_minutes,
          deepWorkMinutes: existingArcDay.deep_work_minutes,
          executionPercent:
            existingArcDay.planned_tasks > 0
              ? Math.round(
                  (existingArcDay.completed_tasks / existingArcDay.planned_tasks) *
                    100,
                )
              : 0,
          isPerfectDay: false,
          perfectBonus: 0,
          alreadyClosed: true,
        },
      };
    }

    // Find all tasks for this date
    const tasks = await this.prisma.task.findMany({
      where: {
        arc_id: arcId,
        scheduled_date: date,
      },
    });

    let missedCount = 0;
    // Mark leftover PENDING or IN_PROGRESS tasks as MISSED
    for (const task of tasks) {
      if (
        task.status === TaskStatus.PENDING ||
        task.status === TaskStatus.IN_PROGRESS
      ) {
        await this.prisma.task.update({
          where: { id: task.id },
          data: { status: TaskStatus.MISSED },
        });

        await this.prisma.taskEvent.create({
          data: {
            task_id: task.id,
            user_id: userId,
            from_status: task.status,
            to_status: TaskStatus.MISSED,
            event_type: 'TASK_MISSED',
            actor: ChangeActor.SYSTEM,
          },
        });

        this.eventEmitter.emit(DOMAIN_EVENTS.TASK_MISSED, {
          userId,
          arcId,
          taskId: task.id,
        });

        missedCount++;
      }
    }

    // Re-fetch all tasks after status update
    const finalTasks = await this.prisma.task.findMany({
      where: {
        arc_id: arcId,
        scheduled_date: date,
      },
    });

    const plannedTasks = finalTasks.length;
    const completedTasks = finalTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    ).length;
    const skippedTasks = finalTasks.filter(
      (t) => t.status === TaskStatus.SKIPPED,
    ).length;
    const abandonedTasks = finalTasks.filter(
      (t) => t.status === TaskStatus.ABANDONED,
    ).length;
    const completedMinutes = finalTasks
      .filter((t) => t.status === TaskStatus.COMPLETED)
      .reduce((sum, t) => sum + (t.actual_minutes || t.estimated_minutes), 0);
    const plannedMinutes = finalTasks.reduce(
      (sum, t) => sum + t.estimated_minutes,
      0,
    );

    // Deep work minutes from focus sessions on this day
    const focusSessions = await this.prisma.focusSession.findMany({
      where: {
        user_id: userId,
        status: 'COMPLETED',
        started_at: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lte: new Date(`${date}T23:59:59.999Z`),
        },
      },
    });
    const deepWorkMinutes = focusSessions.reduce(
      (sum, s) => sum + Math.round(s.duration_seconds / 60),
      0,
    );

    const isPerfectDay =
      plannedTasks > 0 &&
      completedTasks === plannedTasks &&
      missedCount === 0 &&
      skippedTasks === 0;

    let perfectBonus = 0;
    if (isPerfectDay) {
      perfectBonus = this.scoringService.getPerfectDayBonus();
      await this.scoringService.applyScoreDelta({
        userId,
        arcId,
        delta: perfectBonus,
        reason: `Perfect day bonus for ${date}`,
      });

      await this.streaksService.recordSuccessfulDay(userId, arcId, date);
    } else if (missedCount > 0 || (plannedTasks > 0 && completedTasks === 0)) {
      await this.streaksService.breakStreak(
        userId,
        arcId,
        `Day closed with missed/incomplete tasks on ${date}`,
      );
    }

    const updatedArcDay = await this.prisma.arcDay.upsert({
      where: { arc_id_date: { arc_id: arcId, date } },
      create: {
        arc_id: arcId,
        date,
        planned_minutes: plannedMinutes,
        completed_minutes: completedMinutes,
        deep_work_minutes: deepWorkMinutes,
        planned_tasks: plannedTasks,
        completed_tasks: completedTasks,
        missed_tasks: missedCount,
        skipped_tasks: skippedTasks,
        abandoned_tasks: abandonedTasks,
        status: DayStatus.CLOSED,
        closed_at: new Date(),
      },
      update: {
        planned_minutes: plannedMinutes,
        completed_minutes: completedMinutes,
        deep_work_minutes: deepWorkMinutes,
        planned_tasks: plannedTasks,
        completed_tasks: completedTasks,
        missed_tasks: missedCount,
        skipped_tasks: skippedTasks,
        abandoned_tasks: abandonedTasks,
        status: DayStatus.CLOSED,
        closed_at: new Date(),
      },
    });

    const executionPercent =
      plannedTasks > 0 ? Math.round((completedTasks / plannedTasks) * 100) : 0;

    this.eventEmitter.emit(DOMAIN_EVENTS.DAY_CLOSED, {
      userId,
      arcId,
      date,
      executionPercent,
      isPerfectDay,
    });

    return {
      arcDay: updatedArcDay,
      summary: {
        plannedTasks,
        completedTasks,
        missedTasks: missedCount,
        skippedTasks,
        abandonedTasks,
        plannedMinutes,
        completedMinutes,
        deepWorkMinutes,
        executionPercent,
        isPerfectDay,
        perfectBonus,
      },
    };
  }
}
