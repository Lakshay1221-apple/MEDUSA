import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPayload } from '../notifications/delivery-provider.interface';

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  async processNotificationJob(payload: NotificationPayload) {
    this.logger.log(`Processing background notification job: ${payload.type} for user ${payload.userId}`);
    return this.notificationsService.dispatch(payload);
  }
}
