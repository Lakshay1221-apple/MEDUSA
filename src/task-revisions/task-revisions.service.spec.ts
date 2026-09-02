import { TaskRevisionsService } from './task-revisions.service';
import { ChangeActor, TaskPriority } from '@prisma/client';

describe('TaskRevisionsService', () => {
  let taskRevisionsService: TaskRevisionsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      task: {
        update: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: 'task-1' }),
      },
      taskRevision: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    taskRevisionsService = new TaskRevisionsService(mockPrisma);
  });

  it('should create version 1 if no prior revision exists', async () => {
    mockPrisma.taskRevision.findFirst.mockResolvedValue(null);
    mockPrisma.taskRevision.create.mockResolvedValue({ id: 'rev-1', version: 1 });

    const rev = await taskRevisionsService.createRevision({
      taskId: 'task-1',
      title: 'Study Redis',
      categoryId: 'cat-1',
      estimatedMinutes: 30,
      difficulty: 1,
      priority: TaskPriority.MEDIUM,
      changedBy: ChangeActor.AI,
    });

    expect(mockPrisma.taskRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ version: 1, changed_by: ChangeActor.AI }),
    });
    expect(rev.version).toBe(1);
  });

  it('should increment version to 2+ on subsequent user modifications and mark user_modified: true', async () => {
    mockPrisma.taskRevision.findFirst.mockResolvedValue({ version: 1 });
    mockPrisma.taskRevision.create.mockResolvedValue({ id: 'rev-2', version: 2 });

    const rev = await taskRevisionsService.createRevision({
      taskId: 'task-1',
      title: 'Study Redis + Build demo',
      categoryId: 'cat-1',
      estimatedMinutes: 45,
      difficulty: 2,
      priority: TaskPriority.HIGH,
      changedBy: ChangeActor.USER,
    });

    expect(mockPrisma.taskRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ version: 2, changed_by: ChangeActor.USER }),
    });
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: expect.objectContaining({ current_revision_id: 'rev-2', user_modified: true }),
    });
    expect(rev.version).toBe(2);
  });
});
