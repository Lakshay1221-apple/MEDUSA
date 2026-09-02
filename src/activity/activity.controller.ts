import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GitDotMode } from './gitdot.engine';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('graph')
  async getGraph(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId?: string,
    @Query('mode') mode?: GitDotMode,
  ) {
    return this.activityService.getActivityGraph(userId, arcId, mode);
  }
}
