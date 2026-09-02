import { WorkspacesService } from './workspaces.service';
import { ForbiddenException } from '@nestjs/common';

describe('WorkspacesService', () => {
  let workspacesService: WorkspacesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      workspace: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      workspaceMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    workspacesService = new WorkspacesService(mockPrisma);
  });

  describe('Leaderboard Privacy & Authorization', () => {
    it('should throw ForbiddenException if user is not a member of the workspace', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(
        workspacesService.getLeaderboard('non-member-id', 'ws-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return aggregate public metrics without exposing private tasks/documents', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({
        workspace_id: 'ws-1',
        user_id: 'user-1',
      });

      mockPrisma.workspaceMember.findMany.mockResolvedValue([
        {
          user_id: 'user-1',
          user: {
            name: 'User 1',
            user_stats: [{ current_score: 100, current_streak: 5, total_completed: 10, total_skipped: 0 }],
          },
        },
        {
          user_id: 'user-2',
          user: {
            name: 'User 2',
            user_stats: [{ current_score: 200, current_streak: 8, total_completed: 20, total_skipped: 1 }],
          },
        },
      ]);

      const leaderboard = await workspacesService.getLeaderboard('user-1', 'ws-1');

      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].userId).toBe('user-2'); // higher score ranked #1
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[0].score).toBe(200);

      expect(leaderboard[1].userId).toBe('user-1');
      expect(leaderboard[1].rank).toBe(2);

      // Verify no sensitive fields exist on leaderboard item
      expect((leaderboard[0] as any).tasks).toBeUndefined();
      expect((leaderboard[0] as any).skipReasons).toBeUndefined();
      expect((leaderboard[0] as any).documents).toBeUndefined();
    });
  });
});
