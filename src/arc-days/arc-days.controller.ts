import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ArcDaysService } from './arc-days.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('arcs/:arcId/days')
@UseGuards(JwtAuthGuard)
export class ArcDaysController {
  constructor(private readonly arcDaysService: ArcDaysService) {}

  @Get()
  async listDays(
    @CurrentUser('id') userId: string,
    @Param('arcId') arcId: string,
  ) {
    return this.arcDaysService.listArcDays(userId, arcId);
  }

  @Get(':date')
  async getDay(
    @CurrentUser('id') userId: string,
    @Param('arcId') arcId: string,
    @Param('date') date: string,
  ) {
    return this.arcDaysService.getArcDay(userId, arcId, date);
  }

  @Post(':date/close')
  async closeDay(
    @CurrentUser('id') userId: string,
    @Param('arcId') arcId: string,
    @Param('date') date: string,
  ) {
    return this.arcDaysService.closeDay(userId, arcId, date);
  }
}
