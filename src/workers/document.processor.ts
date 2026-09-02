import { Injectable, Logger } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';

@Injectable()
export class DocumentProcessor {
  private readonly logger = new Logger(DocumentProcessor.name);

  constructor(private readonly documentsService: DocumentsService) {}

  async processJob(documentId: string) {
    this.logger.log(`Processing document job: ${documentId}`);
    await this.documentsService.processDocument(documentId);
  }
}
