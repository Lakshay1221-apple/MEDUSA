import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwtService: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock_access_token'),
    };
    mockConfig = {
      get: jest.fn((key, def) => def),
    };

    authService = new AuthService(mockPrisma, mockJwtService, mockConfig);
  });

  describe('signup', () => {
    it('should create user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        name: 'Test User',
        email: 'test@medusa.app',
        password_hash: 'hashed_pwd',
        timezone: 'UTC',
        commitment_phrase: 'I ACCEPT THE COST',
      });

      const res = await authService.signup({
        name: 'Test User',
        email: 'test@medusa.app',
        password: 'password123',
      });

      expect(res.user.email).toBe('test@medusa.app');
      expect(res.tokens.access_token).toBe('mock_access_token');
      expect(res.tokens.refresh_token).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        authService.signup({
          name: 'Test User',
          email: 'test@medusa.app',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should authenticate user and return tokens when credentials match', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@medusa.app',
        password_hash: passwordHash,
      });

      const res = await authService.login({
        email: 'test@medusa.app',
        password: 'password123',
      });

      expect(res.tokens.access_token).toBe('mock_access_token');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@medusa.app',
        password_hash: passwordHash,
      });

      await expect(
        authService.login({
          email: 'test@medusa.app',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
