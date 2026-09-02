import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TaskRevisionsService } from '../task-revisions/task-revisions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { SkipTaskDto } from './dto/skip-task.dto';
import { AbandonTaskDto } from './dto/abandon-task.dto';
import { RescheduleTaskDto } from './dto/reschedule-task.dto';
import { TaskStatus } from '@prisma/client';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly taskRevisionsService: TaskRevisionsService,
  ) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.createTask(userId, dto);
  }

  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId?: string,
    @Query('date') date?: string,
    @Query('status') status?: TaskStatus,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.tasksService.listTasks(userId, { arcId, date, status, categoryId });
  }

  @Get(':id')
  async getOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tasksService.getTaskById(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask(userId, id, dto);
  }

  @Post(':id/complete')
  async complete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
  ) {
    return this.tasksService.completeTask(userId, id, dto);
  }

  @Post(':id/skip')
  async skip(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SkipTaskDto,
  ) {
    return this.tasksService.skipTask(userId, id, dto);
  }

  @Post(':id/abandon')
  async abandon(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AbandonTaskDto,
  ) {
    return this.tasksService.abandonTask(userId, id, dto);
  }

  @Post(':id/reschedule')
  async reschedule(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleTaskDto,
  ) {
    return this.tasksService.rescheduleTask(userId, id, dto);
  }

  @Delete(':id')
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tasksService.deleteTask(userId, id);
  }

  @Get(':id/revisions')
  async getRevisions(@Param('id') id: string) {
    return this.taskRevisionsService.getRevisionHistory(id);
  }
}
