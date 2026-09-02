import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GitDotMode } from '../activity/gitdot.engine';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('activity-graph')
  async getActivityGraph(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId?: string,
    @Query('mode') mode?: GitDotMode,
  ) {
    return this.analyticsService.getActivityGraph(userId, arcId, mode);
  }

  @Get('war-report')
  async getWarReport(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId: string,
  ) {
    return this.analyticsService.getWarReport(userId, arcId);
  }
}
