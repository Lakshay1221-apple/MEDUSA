import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import {
  AutoSchedulerEngine,
  SchedulerArcInput,
  SchedulerTaskInput,
} from './auto-scheduler.engine';
import { SchedulePlanStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a new SchedulePlan draft for the Arc.
   */
  async generateSchedulePlan(userId: string, dto: GenerateScheduleDto) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: dto.arc_id },
      include: {
        habits: { where: { active: true } },
      },
    });

    if (!arc || arc.user_id !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Access to this arc is forbidden',
      });
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        arc_id: dto.arc_id,
        status: { in: [TaskStatus.BACKLOG, TaskStatus.PENDING] },
      },
      include: {
        dependencies: true,
      },
    });

    const startDateStr = arc.start_date.toISOString().split('T')[0];
    const endDateStr = arc.end_date.toISOString().split('T')[0];

    const arcInput: SchedulerArcInput = {
      id: arc.id,
      startDate: startDateStr,
      endDate: endDateStr,
      dailyCapacityMinutes: arc.daily_capacity_minutes,
      weeklyCapacityMinutes: arc.weekly_capacity_minutes,
      blackoutDates: dto.blackout_dates || [],
    };

    const taskInputs: SchedulerTaskInput[] = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      estimatedMinutes: t.estimated_minutes,
      difficulty: t.difficulty,
      priority: t.priority as any,
      categoryId: t.category_id,
      deadline: t.deadline ? t.deadline.toISOString() : null,
      scheduledDate: t.scheduled_date,
      isPinned: dto.pinned_task_ids?.includes(t.id) || t.user_modified,
      dependsOnTaskIds: t.dependencies.map((d) => d.depends_on_task_id),
    }));

    // Daily commitments from recurring habits
    const dailyHabitMinutes = arc.habits.reduce(
      (sum, h) => sum + h.estimated_minutes,
      0,
    );
    const existingCommitments: Record<string, number> = {};
    // Reserve habit minutes for every day

    const placements = AutoSchedulerEngine.schedule(
      arcInput,
      taskInputs,
      existingCommitments,
    );

    // Save as DRAFT SchedulePlan
    const plan = await this.prisma.schedulePlan.create({
      data: {
        arc_id: arc.id,
        status: SchedulePlanStatus.DRAFT,
        algorithm_version: '1.0.0',
        items: {
          create: placements.map((p) => ({
            task_id: p.taskId,
            date: p.date,
            start_time: p.startTime || null,
            end_time: p.endTime || null,
            reason: p.reason,
          })),
        },
      },
      include: {
        items: { include: { task: true } },
      },
    });

    return plan;
  }

  /**
   * Accepts a schedule plan, applying its dates to the actual tasks.
   */
  async acceptSchedulePlan(userId: string, planId: string) {
    const plan = await this.prisma.schedulePlan.findUnique({
      where: { id: planId },
      include: {
        arc: true,
        items: true,
      },
    });

    if (!plan || plan.arc.user_id !== userId) {
      throw new NotFoundException({
        code: 'SCHEDULE_PLAN_NOT_FOUND',
        message: 'Schedule plan not found',
      });
    }

    if (plan.status === SchedulePlanStatus.ACCEPTED) {
      return plan;
    }

    // Mark prior plans as SUPERSEDED
    await this.prisma.schedulePlan.updateMany({
      where: {
        arc_id: plan.arc_id,
        status: SchedulePlanStatus.ACCEPTED,
      },
      data: { status: SchedulePlanStatus.SUPERSEDED },
    });

    // Mark this plan as ACCEPTED
    await this.prisma.schedulePlan.update({
      where: { id: planId },
      data: { status: SchedulePlanStatus.ACCEPTED },
    });

    // Apply scheduled dates to tasks
    for (const item of plan.items) {
      await this.prisma.task.update({
        where: { id: item.task_id },
        data: {
          scheduled_date: item.date,
          scheduled_start: item.start_time,
          scheduled_end: item.end_time,
          status: TaskStatus.PENDING,
        },
      });
    }

    return this.prisma.schedulePlan.findUnique({
      where: { id: planId },
      include: {
        items: { include: { task: true } },
      },
    });
  }

  async getLatestPlan(userId: string, arcId: string) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: arcId },
    });
    if (!arc || arc.user_id !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Access to this arc is forbidden',
      });
    }

    return this.prisma.schedulePlan.findFirst({
      where: { arc_id: arcId },
      orderBy: { generated_at: 'desc' },
      include: {
        items: { include: { task: true } },
      },
    });
  }
}
