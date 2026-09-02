import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ChangeActor, TaskPriority } from '@prisma/client';

export interface CreateRevisionParams {
  taskId: string;
  title: string;
  description?: string | null;
  categoryId: string;
  estimatedMinutes: number;
  difficulty: number;
  priority: TaskPriority;
  changedBy: ChangeActor;
  changeSummary?: string;
}

@Injectable()
export class TaskRevisionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new versioned revision for a task.
   */
  async createRevision(params: CreateRevisionParams) {
    const {
      taskId,
      title,
      description,
      categoryId,
      estimatedMinutes,
      difficulty,
      priority,
      changedBy,
      changeSummary,
    } = params;

    // Get latest version number
    const latestRevision = await this.prisma.taskRevision.findFirst({
      where: { task_id: taskId },
      orderBy: { version: 'desc' },
    });

    const nextVersion = latestRevision ? latestRevision.version + 1 : 1;

    const revision = await this.prisma.taskRevision.create({
      data: {
        task_id: taskId,
        version: nextVersion,
        title,
        description: description || null,
        category_id: categoryId,
        estimated_minutes: estimatedMinutes,
        difficulty,
        priority,
        changed_by: changedBy,
        change_summary: changeSummary || null,
      },
    });

    // Update current_revision_id on the task
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        current_revision_id: revision.id,
        user_modified: changedBy === ChangeActor.USER ? true : undefined,
      },
    });

    return revision;
  }

  /**
   * Returns complete history of revisions for a task.
   */
  async getRevisionHistory(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: `Task ${taskId} not found`,
      });
    }

    return this.prisma.taskRevision.findMany({
      where: { task_id: taskId },
      orderBy: { version: 'desc' },
      include: { category: true },
    });
  }
}
