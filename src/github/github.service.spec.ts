import { GithubService } from './github.service';
import { encryptToken } from '../common/utils/crypto';
import { VerificationStatus, TaskStatus } from '@prisma/client';

describe('GithubService', () => {
  let githubService: GithubService;
  let mockPrisma: any;
  let mockConfig: any;
  let mockScoring: any;
  let mockTasks: any;
  let mockEventEmitter: any;
  const encryptionKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    mockPrisma = {
      user: {
        update: jest.fn().mockResolvedValue({ id: 'user-1', github_username: 'medusa-dev' }),
        findUnique: jest.fn(),
      },
      task: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    mockConfig = {
      get: jest.fn((key, def) => (key === 'security.encryptionKey' ? encryptionKey : def)),
    };
    mockScoring = {
      applyScoreDelta: jest.fn(),
    };
    mockTasks = {
      completeTask: jest.fn(),
    };
    mockEventEmitter = {
      emit: jest.fn(),
    };

    githubService = new GithubService(
      mockPrisma,
      mockConfig,
      mockScoring,
      mockTasks,
      mockEventEmitter,
    );
  });

  it('should encrypt and save GitHub token on connect', async () => {
    const res = await githubService.connectGithub('user-1', {
      github_username: 'medusa-dev',
      oauth_token: 'gho_token12345',
    });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        github_username: 'medusa-dev',
        github_oauth_token_encrypted: expect.stringContaining(':'),
      }),
    });
    expect(res.github_username).toBe('medusa-dev');
  });

  it('should verify matching tasks when GitHub activity is detected', async () => {
    const encrypted = encryptToken('gho_token12345', encryptionKey);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      github_username: 'medusa-dev',
      github_oauth_token_encrypted: encrypted,
    });
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-gh',
        status: TaskStatus.PENDING,
        verification_type: 'GITHUB_COMMIT',
      },
    ]);

    const res = await githubService.verifyToday('user-1', 'arc-1', '2026-09-02');

    expect(res.hasActivity).toBe(true);
    expect(mockTasks.completeTask).toHaveBeenCalledWith('user-1', 'task-gh');
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-gh' },
      data: { verification_status: VerificationStatus.VERIFIED },
    });
    expect(res.verifiedTaskIds).toContain('task-gh');
  });

  it('should reconcile and flag tasks as UNVERIFIED if manual completion had no GitHub activity', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      github_username: null,
      github_oauth_token_encrypted: null,
    });
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: 'task-unverified',
        status: TaskStatus.COMPLETED,
        verification_type: 'GITHUB_COMMIT',
        verification_status: VerificationStatus.PENDING,
      },
    ]);

    const res = await githubService.verifyToday('user-1', 'arc-1', '2026-09-02');

    expect(res.hasActivity).toBe(false);
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-unverified' },
      data: { verification_status: VerificationStatus.UNVERIFIED },
    });
    expect(res.reconciledTaskIds).toContain('task-unverified');
  });
});
