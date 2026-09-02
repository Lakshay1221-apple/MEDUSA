import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AccountabilityService } from './accountability.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('accountability')
@UseGuards(JwtAuthGuard)
export class AccountabilityController {
  constructor(private readonly accountabilityService: AccountabilityService) {}

  @Post('evaluate')
  async evaluate(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId: string,
  ) {
    return this.accountabilityService.evaluateUser(userId, arcId);
  }

  @Get('tags')
  async listTags(@CurrentUser('id') userId: string) {
    return this.accountabilityService.listTags(userId);
  }

  @Get('findings')
  async listFindings(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId: string,
  ) {
    return this.accountabilityService.listFindings(userId, arcId);
  }
}
