import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ArcsService } from './arcs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateArcDto } from './dto/create-arc.dto';
import { UpdateArcDto } from './dto/update-arc.dto';

@Controller('arcs')
@UseGuards(JwtAuthGuard)
export class ArcsController {
  constructor(private readonly arcsService: ArcsService) {}

  @Post()
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateArcDto) {
    return this.arcsService.createArc(userId, dto);
  }

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return this.arcsService.listArcs(userId);
  }

  @Get(':id')
  async getOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.arcsService.getArcById(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateArcDto,
  ) {
    return this.arcsService.updateArc(userId, id, dto);
  }
}
