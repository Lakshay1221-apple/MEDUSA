import { DocumentsService } from './documents.service';
import { DocumentFileType, DocumentStatus } from '@prisma/client';

describe('DocumentsService', () => {
  let documentsService: DocumentsService;
  let mockPrisma: any;
  let mockStorage: any;
  let mockAi: any;
  let mockTaskRevisions: any;

  beforeEach(() => {
    mockPrisma = {
      arc: { findUnique: jest.fn().mockResolvedValue({ id: 'arc-1', user_id: 'user-1' }) },
      sourceDocument: {
        create: jest.fn().mockResolvedValue({ id: 'doc-1', status: DocumentStatus.UPLOADED }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      documentSection: { create: jest.fn().mockResolvedValue({ id: 'sec-1' }) },
      documentChunk: { create: jest.fn().mockResolvedValue({ id: 'chunk-1' }), update: jest.fn() },
      category: { findMany: jest.fn().mockResolvedValue([{ id: 'cat-1', slug: 'BACKEND' }]) },
      task: { create: jest.fn().mockResolvedValue({ id: 'task-1' }) },
      taskEvent: { create: jest.fn() },
    };
    mockStorage = {
      uploadFile: jest.fn().mockResolvedValue({ storageKey: 'key-1', storageUrl: 'url-1' }),
      getFileBuffer: jest.fn().mockResolvedValue(Buffer.from('# Module 1\nStudy Redis')),
    };
    mockAi = {
      parseDocument: jest.fn().mockReturnValue({
        title: 'test.md',
        rawText: 'text',
        sections: [{ title: 'Module 1', sectionType: 'MODULE', orderIndex: 0, children: [] }],
        chunks: ['Learn Redis and build caching demo'],
      }),
      extractTasks: jest.fn().mockResolvedValue({
        success: true,
        tasks: [{ title: 'Learn Redis', description: 'desc', category: 'BACKEND', estimated_minutes: 60, difficulty: 2, priority: 'HIGH' }],
      }),
    };
    mockTaskRevisions = {
      createRevision: jest.fn().mockResolvedValue({ id: 'rev-1' }),
    };

    documentsService = new DocumentsService(
      mockPrisma,
      mockStorage,
      mockAi,
      mockTaskRevisions,
    );
  });

  describe('uploadDocument & processing', () => {
    it('should upload document and initiate parsing pipeline', async () => {
      const doc = await documentsService.uploadDocument('user-1', {
        arc_id: 'arc-1',
        filename: 'syllabus.md',
        file_type: DocumentFileType.MARKDOWN,
        content: '# Module 1\nStudy Redis',
      });

      expect(mockStorage.uploadFile).toHaveBeenCalled();
      expect(mockPrisma.sourceDocument.create).toHaveBeenCalled();
      expect(doc.id).toBe('doc-1');
    });

    it('should process document successfully and generate AI tasks with v1 revision', async () => {
      mockPrisma.sourceDocument.findUnique.mockResolvedValue({
        id: 'doc-1',
        user_id: 'user-1',
        arc_id: 'arc-1',
        original_filename: 'test.md',
        storage_key: 'key-1',
      });

      await documentsService.processDocument('doc-1', '# Module 1\nStudy Redis');

      expect(mockPrisma.sourceDocument.update).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: expect.objectContaining({ status: DocumentStatus.COMPLETED }),
      });
      expect(mockPrisma.task.create).toHaveBeenCalled();
      expect(mockTaskRevisions.createRevision).toHaveBeenCalled();
    });
  });
});
