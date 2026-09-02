import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FocusService } from './focus.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StartFocusDto, CompleteFocusDto } from './dto/start-focus.dto';

@Controller('focus')
@UseGuards(JwtAuthGuard)
export class FocusController {
  constructor(private readonly focusService: FocusService) {}

  @Post('start')
  async start(
    @CurrentUser('id') userId: string,
    @Body() dto: StartFocusDto,
  ) {
    return this.focusService.startFocusSession(userId, dto);
  }

  @Post(':id/complete')
  async complete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CompleteFocusDto,
  ) {
    return this.focusService.completeFocusSession(userId, id, dto);
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.focusService.cancelFocusSession(userId, id);
  }

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.focusService.listFocusSessions(userId);
  }
}
