import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AiService } from '../ai/ai.service';
import { TaskRevisionsService } from '../task-revisions/task-revisions.service';
import { UploadDocumentDto } from './dto/upload-document.dto';
import {
  DocumentStatus,
  ChunkStatus,
  TaskOrigin,
  TaskStatus,
  VerificationStatus,
  ChangeActor,
  DocumentFileType,
} from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
    private readonly taskRevisionsService: TaskRevisionsService,
  ) {}

  async uploadDocument(userId: string, dto: UploadDocumentDto) {
    const arc = await this.prisma.arc.findUnique({
      where: { id: dto.arc_id },
    });
    if (!arc || arc.user_id !== userId) {
      throw new BadRequestException({
        code: 'INVALID_ARC',
        message: 'Specified Arc does not exist or does not belong to the user',
      });
    }

    const contentBuffer = Buffer.from(dto.content, 'utf-8');
    const contentHash = crypto
      .createHash('sha256')
      .update(contentBuffer)
      .digest('hex');

    const upload = await this.storageService.uploadFile(
      contentBuffer,
      dto.filename,
      'text/plain',
    );

    const document = await this.prisma.sourceDocument.create({
      data: {
        user_id: userId,
        arc_id: dto.arc_id,
        file_type: dto.file_type,
        original_filename: dto.filename,
        storage_key: upload.storageKey,
        storage_url: upload.storageUrl,
        content_hash: contentHash,
        status: DocumentStatus.UPLOADED,
      },
    });

    // In background or directly invoke processing
    this.processDocument(document.id, dto.content).catch((err) => {
      this.logger.error(`Error processing document ${document.id}: ${err.message}`);
    });

    return document;
  }

  /**
   * Complete Two-Path Ingestion Pipeline:
   * Path 1: Deterministic AST & Schedule Table parsing for Markdown (.md)
   * Path 2: Chunker + LLM Extraction Contract v2 for plain text / PDF
   */
  async processDocument(documentId: string, rawContent?: string) {
    const document = await this.prisma.sourceDocument.findUnique({
      where: { id: documentId },
    });
    if (!document) return;

    try {
      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.PARSING },
      });

      let content = rawContent;
      if (!content) {
        const buffer = await this.storageService.getFileBuffer(document.storage_key);
        content = buffer.toString('utf-8');
      }

      // Clean up previous attempts if retrying (Idempotency)
      if (typeof this.prisma.task?.deleteMany === 'function') {
        await this.prisma.task.deleteMany({ where: { source_document_id: documentId } });
      }
      if (typeof this.prisma.documentChunk?.deleteMany === 'function') {
        await this.prisma.documentChunk.deleteMany({ where: { document_id: documentId } });
      }
      if (typeof this.prisma.documentSection?.deleteMany === 'function') {
        await this.prisma.documentSection.deleteMany({ where: { document_id: documentId } });
      }

      const parsed = this.aiService.parseDocument(content, document.original_filename);

      // Save hierarchical sections
      for (const sec of parsed.sections) {
        const dbSection = await this.prisma.documentSection.create({
          data: {
            document_id: documentId,
            title: sec.title,
            section_type: sec.sectionType,
            order_index: sec.orderIndex,
            source_text: sec.sourceText,
          },
        });

        for (const child of sec.children) {
          await this.prisma.documentSection.create({
            data: {
              document_id: documentId,
              parent_id: dbSection.id,
              title: child.title,
              section_type: child.sectionType,
              order_index: child.orderIndex,
              source_text: child.sourceText,
            },
          });
        }
      }

      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: { status: DocumentStatus.EXTRACTING },
      });

      // Get or create default categories for assignment
      let categories = await this.prisma.category.findMany({
        where: { OR: [{ user_id: null }, { user_id: document.user_id }] },
      });
      if (!categories || categories.length === 0) {
        const defaultCat = await this.prisma.category.create({
          data: {
            user_id: document.user_id,
            name: 'General',
            slug: 'GENERAL',
            color_token: 'blue',
            priority: 1,
            weekly_target_minutes: 600,
          },
        });
        categories = [defaultCat];
      }

      const categoryMap = new Map<string, string>();
      for (const cat of categories) {
        if (cat?.slug) categoryMap.set(cat.slug.toUpperCase(), cat.id);
        if (cat?.name) categoryMap.set(cat.name.toUpperCase(), cat.id);
      }
      const defaultCategoryId = categories[0]?.id || 'default-category';

      // =========================================================================
      // PATH 1: Deterministic Markdown Schedule Path
      // =========================================================================
      const isMarkdown = document.file_type === DocumentFileType.MARKDOWN || content.includes('|') || content.includes('#');
      let extractedTasks: any[] = [];

      if (isMarkdown) {
        const scheduleResult = this.aiService.parseMarkdownSchedule(content);
        if (scheduleResult.tasks.length > 0) {
          extractedTasks = scheduleResult.tasks;
        }
      }

      // Create chunks in database for visualization
      for (let i = 0; i < parsed.chunks.length; i++) {
        await this.prisma.documentChunk.create({
          data: {
            document_id: documentId,
            chunk_index: i,
            content: parsed.chunks[i],
            extraction_status: ChunkStatus.EXTRACTED,
          },
        });
      }

      // =========================================================================
      // PATH 2: Fallback to LLM Extraction Contract v2 if no schedule tasks found
      // =========================================================================
      if (extractedTasks.length === 0) {
        for (let i = 0; i < parsed.chunks.length; i++) {
          const chunkText = parsed.chunks[i];
          const result = await this.aiService.extractTasks(chunkText);
          if (result.success && result.tasks.length > 0) {
            extractedTasks.push(...result.tasks);
          }
        }
      }

      // Persist atomic tasks
      for (const extracted of extractedTasks) {
        const requestedCatKey = (extracted?.category || '').toUpperCase();
        const catId = categoryMap.get(requestedCatKey) || defaultCategoryId;

        const task = await this.prisma.task.create({
          data: {
            user_id: document.user_id,
            arc_id: document.arc_id,
            title: extracted.title,
            description: extracted.description || `Extracted directive from ${document.original_filename}`,
            origin: TaskOrigin.AI,
            user_modified: false,
            category_id: catId,
            source_document_id: documentId,
            estimated_minutes: extracted.estimated_minutes || 60,
            difficulty: extracted.difficulty || 2,
            priority: (extracted.priority as any) || 'MEDIUM',
            status: TaskStatus.BACKLOG,
            scheduled_date: extracted.scheduled_date || null,
            verification_type: 'MANUAL',
            verification_status: VerificationStatus.UNVERIFIED,
          },
        });

        // Create initial revision v1 (AI)
        await this.taskRevisionsService.createRevision({
          taskId: task.id,
          title: task.title,
          description: task.description,
          categoryId: task.category_id,
          estimatedMinutes: task.estimated_minutes,
          difficulty: task.difficulty,
          priority: task.priority,
          changedBy: ChangeActor.AI,
          changeSummary: `AI generated from document: ${document.original_filename}`,
        });

        await this.prisma.taskEvent.create({
          data: {
            task_id: task.id,
            user_id: document.user_id,
            from_status: null,
            to_status: TaskStatus.BACKLOG,
            event_type: 'AI_TASK_EXTRACTED',
            actor: ChangeActor.AI,
          },
        });
      }

      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.COMPLETED,
          processed_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Document processing failed: ${error.message}`, error.stack);
      await this.prisma.sourceDocument.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.FAILED,
          error_message: error.message,
        },
      });
    }
  }

  async getDocument(userId: string, documentId: string) {
    const document = await this.prisma.sourceDocument.findUnique({
      where: { id: documentId },
      include: {
        sections: { include: { children: true } },
        chunks: true,
        tasks: {
          include: { category: true, revisions: true },
        },
      },
    });

    if (!document || document.user_id !== userId) {
      throw new NotFoundException({
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found',
      });
    }

    return document;
  }

  async listDocuments(userId: string, arcId: string) {
    return this.prisma.sourceDocument.findMany({
      where: { user_id: userId, arc_id: arcId },
      include: {
        _count: { select: { sections: true, chunks: true, tasks: true } },
      },
      orderBy: { uploaded_at: 'desc' },
    });
  }

  async retryDocument(userId: string, documentId: string) {
    const document = await this.prisma.sourceDocument.findUnique({
      where: { id: documentId },
    });

    if (!document || document.user_id !== userId) {
      throw new NotFoundException({
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found or access denied',
      });
    }

    this.processDocument(document.id).catch((err) => {
      this.logger.error(`Error retrying document ${document.id}: ${err.message}`);
    });

    return { message: 'Document re-processing started', documentId: document.id };
  }
}
