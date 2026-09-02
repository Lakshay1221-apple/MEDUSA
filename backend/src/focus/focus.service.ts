import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ScoringService } from '../scoring/scoring.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '../common/constants/events';
import { StartFocusDto, CompleteFocusDto } from './dto/start-focus.dto';
import { FocusStatus } from '@prisma/client';

@Injectable()
export class FocusService {
  private readonly logger = new Logger(FocusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async startFocusSession(userId: string, dto: StartFocusDto) {
    if (dto.task_id) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.task_id },
      });
      if (!task || task.user_id !== userId) {
        throw new NotFoundException({
          code: 'TASK_NOT_FOUND',
          message: 'Task not found',
        });
      }
    }

    const session = await this.prisma.focusSession.create({
      data: {
        user_id: userId,
        task_id: dto.task_id || null,
        status: FocusStatus.ACTIVE,
        started_at: new Date(),
      },
      include: { task: true },
    });

    this.eventEmitter.emit(DOMAIN_EVENTS.FOCUS_STARTED, {
      userId,
      sessionId: session.id,
      taskId: session.task_id,
    });

    return session;
  }

  async completeFocusSession(
    userId: string,
    sessionId: string,
    dto?: CompleteFocusDto,
  ) {
    const session = await this.prisma.focusSession.findUnique({
      where: { id: sessionId },
      include: { task: true },
    });

    if (!session || session.user_id !== userId) {
      throw new NotFoundException({
        code: 'FOCUS_SESSION_NOT_FOUND',
        message: 'Focus session not found',
      });
    }

    if (session.status !== FocusStatus.ACTIVE) {
      throw new BadRequestException({
        code: 'FOCUS_SESSION_ALREADY_RESOLVED',
        message: `Focus session is already in status ${session.status}`,
      });
    }

    const endedAt = new Date();
    const calculatedDurationSeconds = Math.round(
      (endedAt.getTime() - session.started_at.getTime()) / 1000,
    );
    const durationSeconds = dto?.duration_seconds ?? calculatedDurationSeconds;
    const durationMinutes = Math.round(durationSeconds / 60);

    const updated = await this.prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        status: FocusStatus.COMPLETED,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
      },
      include: { task: true },
    });

    // If session was associated with an Arc / Task, update ArcDay deep work minutes and apply score points
    if (session.task?.arc_id) {
      const arcId = session.task.arc_id;
      const points = this.scoringService.calculateDeepWorkPoints(durationMinutes);

      if (points > 0) {
        await this.scoringService.applyScoreDelta({
          userId,
          arcId,
          delta: points,
          reason: `Deep work focus session: ${durationMinutes} minutes`,
        });
      }

      // Update UserStats
      await this.prisma.userStats.update({
        where: { arc_id: arcId },
        data: {
          total_deep_work_minutes: { increment: durationMinutes },
        },
      });

      // Update ArcDay deep work if scheduled date
      if (session.task.scheduled_date) {
        await this.prisma.arcDay.upsert({
          where: {
            arc_id_date: {
              arc_id: arcId,
              date: session.task.scheduled_date,
            },
          },
          create: {
            arc_id: arcId,
            date: session.task.scheduled_date,
            deep_work_minutes: durationMinutes,
          },
          update: {
            deep_work_minutes: { increment: durationMinutes },
          },
        });
      }
    }

    this.eventEmitter.emit(DOMAIN_EVENTS.FOCUS_COMPLETED, {
      userId,
      sessionId,
      durationMinutes,
    });

    return updated;
  }

  async cancelFocusSession(userId: string, sessionId: string) {
    const session = await this.prisma.focusSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.user_id !== userId) {
      throw new NotFoundException({
        code: 'FOCUS_SESSION_NOT_FOUND',
        message: 'Focus session not found',
      });
    }

    return this.prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        status: FocusStatus.CANCELLED,
        ended_at: new Date(),
      },
    });
  }

  async listFocusSessions(userId: string) {
    return this.prisma.focusSession.findMany({
      where: { user_id: userId },
      include: { task: true },
      orderBy: { started_at: 'desc' },
    });
  }
}
