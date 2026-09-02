import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  async upload(
    @CurrentUser('id') userId: string,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadDocument(userId, dto);
  }

  @Get()
  async list(
    @CurrentUser('id') userId: string,
    @Query('arcId') arcId: string,
  ) {
    return this.documentsService.listDocuments(userId, arcId);
  }

  @Get(':id')
  async getOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.documentsService.getDocument(userId, id);
  }
}
