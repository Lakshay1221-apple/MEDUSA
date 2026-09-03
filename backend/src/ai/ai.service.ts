import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentParser, ParsedDocument } from './document-parser';
import { LlmExtractor, ExtractionResult } from './llm-extractor';
import { DocumentDiffEngine, DiffResult } from './diff-engine';
import { MarkdownScheduleParser, MarkdownScheduleResult } from './markdown-schedule-parser';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly configService: ConfigService) {}

  parseDocument(content: string, filename: string): ParsedDocument {
    return DocumentParser.parse(content, filename);
  }

  parseMarkdownSchedule(content: string, defaultYear?: number): MarkdownScheduleResult {
    return MarkdownScheduleParser.parse(content, defaultYear);
  }

  async extractTasks(chunkContent: string): Promise<ExtractionResult> {
    const provider = this.configService.get<string>('ai.provider', 'mock');
    const apiKey = this.configService.get<string>('ai.apiKey');
    return LlmExtractor.extractTasksFromChunk(chunkContent, provider, apiKey);
  }

  diffDocuments(oldContent: string, newContent: string): DiffResult {
    return DocumentDiffEngine.diff(oldContent, newContent);
  }
}
