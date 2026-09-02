import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HabitsService } from './habits.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateHabitDto, UpdateHabitDto } from './dto/create-habit.dto';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateHabitDto,
  ) {
    return this.habitsService.createHabit(userId, dto);
  }

  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId: string,
  ) {
    return this.habitsService.listHabits(userId, arcId);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.updateHabit(userId, id, dto);
  }

  @Post('generate-daily')
  async generateDaily(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId: string,
    @Query('date') date: string,
  ) {
    return this.habitsService.generateDailyHabitOccurrences(userId, arcId, date);
  }
}
