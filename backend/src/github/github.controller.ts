import {
  Controller,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GithubService } from './github.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConnectGithubDto } from './dto/connect-github.dto';

@Controller('github')
@UseGuards(JwtAuthGuard)
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Post('connect')
  async connect(
    @CurrentUser('id') userId: string,
    @Body() dto: ConnectGithubDto,
  ) {
    return this.githubService.connectGithub(userId, dto);
  }

  @Post('disconnect')
  async disconnect(@CurrentUser('id') userId: string) {
    return this.githubService.disconnectGithub(userId);
  }

  @Post('verify-today')
  async verifyToday(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId: string,
    @Query('date') date: string,
  ) {
    return this.githubService.verifyToday(userId, arcId, date);
  }
}
