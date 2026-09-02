import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NotificationChannel } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.notificationsService.listNotifications(userId);
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(userId, id);
  }

  @Get('preferences')
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.notificationsService.getPreferences(userId);
  }

  @Patch('preferences')
  async updatePreference(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      notification_type: string;
      enabled: boolean;
      channel?: NotificationChannel;
    },
  ) {
    return this.notificationsService.updatePreference(
      userId,
      body.notification_type,
      body.enabled,
      body.channel,
    );
  }
}
