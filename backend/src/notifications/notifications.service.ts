import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '../common/constants/events';
import {
  DeliveryProvider,
  InAppDeliveryProvider,
  WebPushDeliveryProvider,
  NotificationPayload,
} from './delivery-provider.interface';
import { NotificationChannel } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private providers: DeliveryProvider[] = [
    new InAppDeliveryProvider(),
    new WebPushDeliveryProvider(),
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dispatches a notification if allowed by user preferences.
   */
  async dispatch(payload: NotificationPayload) {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        user_id_notification_type_channel: {
          user_id: payload.userId,
          notification_type: payload.type,
          channel: NotificationChannel.IN_APP,
        },
      },
    });

    // If explicitly disabled, skip
    if (preference && !preference.enabled) {
      return null;
    }

    const notification = await this.prisma.notification.create({
      data: {
        user_id: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        sent_at: new Date(),
        metadata: payload.metadata ? JSON.stringify(payload.metadata) : undefined,
      },
    });

    for (const provider of this.providers) {
      try {
        await provider.send(payload);
      } catch (err) {
        this.logger.warn(`Failed sending notification via ${provider.channel}: ${err.message}`);
      }
    }

    return notification;
  }

  async listNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { read_at: new Date() },
    });
  }

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { user_id: userId },
    });
  }

  async updatePreference(
    userId: string,
    notificationType: string,
    enabled: boolean,
    channel: NotificationChannel = NotificationChannel.IN_APP,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: {
        user_id_notification_type_channel: {
          user_id: userId,
          notification_type: notificationType,
          channel,
        },
      },
      create: {
        user_id: userId,
        notification_type: notificationType,
        channel,
        enabled,
      },
      update: {
        enabled,
      },
    });
  }

  @OnEvent(DOMAIN_EVENTS.TASK_COMPLETED)
  async handleTaskCompleted(event: { userId: string; points: number }) {
    await this.dispatch({
      userId: event.userId,
      type: 'TASK_COMPLETED',
      title: 'Task Completed',
      body: `Execution confirmed. +${event.points} points awarded.`,
    });
  }

  @OnEvent(DOMAIN_EVENTS.TASK_SKIPPED)
  async handleTaskSkipped(event: { userId: string; penalty: number }) {
    await this.dispatch({
      userId: event.userId,
      type: 'TASK_SKIPPED',
      title: 'Task Skipped — Streak Reset',
      body: `You accepted the cost. Penalty: ${event.penalty} points. Current streak reset to 0.`,
    });
  }

  @OnEvent(DOMAIN_EVENTS.STREAK_MILESTONE)
  async handleStreakMilestone(event: { userId: string; milestone: number }) {
    await this.dispatch({
      userId: event.userId,
      type: 'STREAK_MILESTONE',
      title: 'Streak Milestone!',
      body: `Impressive execution! You have achieved an unbroken ${event.milestone}-day streak.`,
    });
  }

  @OnEvent(DOMAIN_EVENTS.DAY_CLOSED)
  async handleDayClosed(event: { userId: string; isPerfectDay: boolean; executionPercent: number }) {
    await this.dispatch({
      userId: event.userId,
      type: 'DAY_CLOSED',
      title: event.isPerfectDay ? 'Perfect Day Achieved!' : 'Day Closed',
      body: `Daily execution: ${event.executionPercent}%. ${event.isPerfectDay ? 'Bonus points applied!' : ''}`,
    });
  }
}
