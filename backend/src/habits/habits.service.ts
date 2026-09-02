import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateHabitDto, UpdateHabitDto } from './dto/create-habit.dto';
import { getDayOfWeek } from '../common/utils/timezone';
import { HabitFrequency, TaskStatus, TaskOrigin, VerificationStatus } from '@prisma/client';

@Injectable()
export class HabitsService {
  private readonly logger = new Logger(HabitsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createHabit(userId: string, dto: CreateHabitDto) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: dto.arc_id },
    });
    if (!arc || arc.user_id !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Access to this arc is forbidden',
      });
    }

    return this.prisma.habit.create({
      data: {
        user_id: userId,
        arc_id: dto.arc_id,
        title: dto.title,
        description: dto.description || null,
        category_id: dto.category_id,
        frequency: dto.frequency ?? HabitFrequency.DAILY,
        target_days: dto.target_days || [],
        estimated_minutes: dto.estimated_minutes ?? 30,
        active: dto.active ?? true,
      },
      include: { category: true },
    });
  }

  async listHabits(userId: string, arcId: string) {
    return this.prisma.habit.findMany({
      where: { user_id: userId, arc_id: arcId },
      include: { category: true },
      orderBy: { created_at: 'asc' },
    });
  }

  async updateHabit(userId: string, habitId: string, dto: UpdateHabitDto) {
    const habit = await this.prisma.habit.findUnique({
      where: { id: habitId },
    });
    if (!habit || habit.user_id !== userId) {
      throw new NotFoundException({
        code: 'HABIT_NOT_FOUND',
        message: 'Habit not found',
      });
    }

    return this.prisma.habit.update({
      where: { id: habitId },
      data: {
        title: dto.title,
        description: dto.description,
        category_id: dto.category_id,
        frequency: dto.frequency,
        target_days: dto.target_days,
        estimated_minutes: dto.estimated_minutes,
        active: dto.active,
      },
      include: { category: true },
    });
  }

  /**
   * Idempotently generates habit tasks for a specific date (YYYY-MM-DD).
   * Ensures that repeating the call will NOT create duplicate tasks for that day.
   */
  async generateDailyHabitOccurrences(userId: string, arcId: string, date: string) {
    const habits = await this.prisma.habit.findMany({
      where: { user_id: userId, arc_id: arcId, active: true },
    });

    const dayOfWeek = getDayOfWeek(date); // e.g. "MON", "SAT"
    const isWeekend = dayOfWeek === 'SAT' || dayOfWeek === 'SUN';

    const createdTasks = [];

    for (const habit of habits) {
      // Check if habit is eligible for this day of week
      let isEligible = false;
      if (habit.frequency === HabitFrequency.DAILY) {
        isEligible = true;
      } else if (habit.frequency === HabitFrequency.WEEKDAYS && !isWeekend) {
        isEligible = true;
      } else if (habit.frequency === HabitFrequency.WEEKENDS && isWeekend) {
        isEligible = true;
      } else if (
        habit.frequency === HabitFrequency.CUSTOM &&
        habit.target_days.includes(dayOfWeek)
      ) {
        isEligible = true;
      }

      if (!isEligible) continue;

      // Idempotency check: Look for an existing task with matching title, arc, user, date, and category
      const existingTask = await this.prisma.task.findFirst({
        where: {
          user_id: userId,
          arc_id: arcId,
          scheduled_date: date,
          title: habit.title,
          category_id: habit.category_id,
        },
      });

      if (!existingTask) {
        const task = await this.prisma.task.create({
          data: {
            user_id: userId,
            arc_id: arcId,
            title: habit.title,
            description: habit.description || `Habit occurrence for ${habit.title}`,
            category_id: habit.category_id,
            estimated_minutes: habit.estimated_minutes,
            difficulty: 1,
            priority: 'MEDIUM',
            scheduled_date: date,
            status: TaskStatus.PENDING,
            origin: TaskOrigin.USER,
            verification_type: habit.title.toLowerCase().includes('github')
              ? 'GITHUB_COMMIT'
              : 'MANUAL',
            verification_status: VerificationStatus.UNVERIFIED,
          },
        });

        // Create revision v1
        await this.prisma.taskRevision.create({
          data: {
            task_id: task.id,
            version: 1,
            title: task.title,
            description: task.description,
            category_id: task.category_id,
            estimated_minutes: task.estimated_minutes,
            difficulty: task.difficulty,
            priority: task.priority,
            changed_by: 'SYSTEM',
            change_summary: 'Generated from recurring habit template',
          },
        });

        await this.prisma.taskEvent.create({
          data: {
            task_id: task.id,
            user_id: userId,
            from_status: null,
            to_status: TaskStatus.PENDING,
            event_type: 'HABIT_TASK_GENERATED',
            actor: 'SYSTEM',
          },
        });

        createdTasks.push(task);
      }
    }

    return {
      date,
      generatedCount: createdTasks.length,
      tasks: createdTasks,
    };
  }
}
