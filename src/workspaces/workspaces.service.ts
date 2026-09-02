import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateWorkspaceDto, JoinWorkspaceDto } from './dto/create-workspace.dto';
import { v4 as uuidv4 } from 'uuid';
import { WorkspaceRole } from '@prisma/client';

export interface LeaderboardEntry {
  userId: string;
  name: string;
  score: number;
  streak: number;
  executionPercent: number;
  lastActiveDate: string | null;
  rank: number;
}

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException({
        code: 'WORKSPACE_SLUG_EXISTS',
        message: `Workspace with slug ${dto.slug} already exists`,
      });
    }

    const inviteCode = `MEDUSA-${uuidv4().substring(0, 8).toUpperCase()}`;

    const workspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug.toLowerCase(),
        invite_code: inviteCode,
        owner_id: userId,
        members: {
          create: {
            user_id: userId,
            role: WorkspaceRole.OWNER,
          },
        },
      },
      include: {
        members: { include: { user: true } },
      },
    });

    return workspace;
  }

  async joinWorkspace(userId: string, dto: JoinWorkspaceDto) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { invite_code: dto.invite_code.trim() },
    });

    if (!workspace) {
      throw new NotFoundException({
        code: 'INVALID_INVITE_CODE',
        message: 'Invalid workspace invite code',
      });
    }

    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspace.id,
          user_id: userId,
        },
      },
    });

    if (existingMember) {
      return { workspace, member: existingMember };
    }

    const member = await this.prisma.workspaceMember.create({
      data: {
        workspace_id: workspace.id,
        user_id: userId,
        role: WorkspaceRole.MEMBER,
      },
    });

    return { workspace, member };
  }

  async listUserWorkspaces(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: { some: { user_id: userId } },
      },
      include: {
        _count: { select: { members: true } },
      },
    });
  }

  /**
   * Retrieves Workspace Leaderboard.
   * PRIVACY GUARANTEE: Exposes ONLY aggregated leaderboard stats (name, score, streak, execution %, rank).
   * Strictly DOES NOT leak tasks, skip reasons, documents, or notes.
   */
  async getLeaderboard(userId: string, workspaceId: string): Promise<LeaderboardEntry[]> {
    // Verify membership
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: 'NOT_A_WORKSPACE_MEMBER',
        message: 'You are not a member of this workspace',
      });
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspace_id: workspaceId },
      include: {
        user: {
          include: {
            user_stats: true,
          },
        },
      },
    });

    const entries: LeaderboardEntry[] = members.map((m) => {
      // Sum stats across active user arcs
      const totalScore = m.user.user_stats.reduce(
        (sum, s) => sum + s.current_score,
        0,
      );
      const maxStreak = Math.max(
        0,
        ...m.user.user_stats.map((s) => s.current_streak),
      );
      const totalCompleted = m.user.user_stats.reduce(
        (sum, s) => sum + s.total_completed,
        0,
      );
      const totalSkipped = m.user.user_stats.reduce(
        (sum, s) => sum + s.total_skipped,
        0,
      );
      const totalTasks = totalCompleted + totalSkipped;
      const executionPercent =
        totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
      const lastActive =
        m.user.user_stats.find((s) => s.last_active_date)?.last_active_date ||
        null;

      return {
        userId: m.user_id,
        name: m.user.name,
        score: totalScore,
        streak: maxStreak,
        executionPercent,
        lastActiveDate: lastActive,
        rank: 1, // calculated after sort
      };
    });

    // Sort by score descending, then streak descending
    entries.sort((a, b) => b.score - a.score || b.streak - a.streak);

    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return entries;
  }
}
