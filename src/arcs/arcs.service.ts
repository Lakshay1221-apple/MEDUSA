import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateArcDto } from './dto/create-arc.dto';
import { UpdateArcDto } from './dto/update-arc.dto';
import { getDateRangeArray } from '../common/utils/timezone';

@Injectable()
export class ArcsService {
  constructor(private readonly prisma: PrismaService) {}

  async createArc(userId: string, dto: CreateArcDto) {
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (endDate <= startDate) {
      throw new BadRequestException({
        code: 'INVALID_ARC_DATES',
        message: 'End date must be after start date',
      });
    }

    const arc = await this.prisma.arc.create({
      data: {
        user_id: userId,
        name: dto.name,
        description: dto.description || null,
        start_date: startDate,
        end_date: endDate,
        timezone: dto.timezone || 'UTC',
        daily_capacity_minutes: dto.daily_capacity_minutes ?? 360,
        weekly_capacity_minutes: dto.weekly_capacity_minutes ?? 2160,
        status: dto.status ?? 'ACTIVE',
      },
    });

    // Initialize UserStats for this Arc
    await this.prisma.userStats.create({
      data: {
        user_id: userId,
        arc_id: arc.id,
        current_score: 0,
        current_streak: 0,
        longest_streak: 0,
      },
    });

    // Pre-create ArcDay entities for the date range
    const startStr = dto.start_date.split('T')[0];
    const endStr = dto.end_date.split('T')[0];
    const dates = getDateRangeArray(startStr, endStr);

    for (const date of dates) {
      await this.prisma.arcDay.create({
        data: {
          arc_id: arc.id,
          date,
        },
      });
    }

    return this.getArcById(userId, arc.id);
  }

  async listArcs(userId: string) {
    return this.prisma.arc.findMany({
      where: { user_id: userId },
      include: {
        user_stats: true,
        _count: {
          select: { tasks: true, habits: true, documents: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getArcById(userId: string, arcId: string) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: arcId },
      include: {
        user_stats: true,
        days: { orderBy: { date: 'asc' } },
        _count: {
          select: { tasks: true, habits: true, documents: true },
        },
      },
    });

    if (!arc) {
      throw new NotFoundException({
        code: 'ARC_NOT_FOUND',
        message: `Arc ${arcId} not found`,
      });
    }

    if (arc.user_id !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not have access to this arc',
      });
    }

    return arc;
  }

  async updateArc(userId: string, arcId: string, dto: UpdateArcDto) {
    await this.getArcById(userId, arcId);

    return this.prisma.arc.update({
      where: { id: arcId },
      data: {
        name: dto.name,
        description: dto.description,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        timezone: dto.timezone,
        daily_capacity_minutes: dto.daily_capacity_minutes,
        weekly_capacity_minutes: dto.weekly_capacity_minutes,
        status: dto.status,
      },
      include: { user_stats: true },
    });
  }
}
