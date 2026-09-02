import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';

@Controller('scheduling')
@UseGuards(JwtAuthGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('plans/generate')
  async generate(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateScheduleDto,
  ) {
    return this.schedulingService.generateSchedulePlan(userId, dto);
  }

  @Post('plans/:id/accept')
  async accept(
    @CurrentUser('id') userId: string,
    @Param('id') planId: string,
  ) {
    return this.schedulingService.acceptSchedulePlan(userId, planId);
  }

  @Get('plans/latest')
  async getLatest(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId: string,
  ) {
    return this.schedulingService.getLatestPlan(userId, arcId);
  }
}
