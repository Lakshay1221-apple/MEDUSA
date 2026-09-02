import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWorkspaceDto, JoinWorkspaceDto } from './dto/create-workspace.dto';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.createWorkspace(userId, dto);
  }

  @Post('join')
  async join(
    @CurrentUser('id') userId: string,
    @Body() dto: JoinWorkspaceDto,
  ) {
    return this.workspacesService.joinWorkspace(userId, dto);
  }

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.workspacesService.listUserWorkspaces(userId);
  }

  @Get(':id/leaderboard')
  async getLeaderboard(
    @CurrentUser('id') userId: string,
    @Param('id') workspaceId: string,
  ) {
    return this.workspacesService.getLeaderboard(userId, workspaceId);
  }
}
