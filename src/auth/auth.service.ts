import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { hashPassword, comparePassword, hashToken } from '../common/utils/crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user with hashed password and default notification preferences.
   */
  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.',
      });
    }

    const hashedPassword = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password_hash: hashedPassword,
        timezone: dto.timezone || 'UTC',
        commitment_phrase: dto.commitment_phrase || 'I ACCEPT THE COST',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Authenticates user by email/password.
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await comparePassword(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Performs refresh token rotation: validates token, revokes old one, and issues new token pair.
   */
  async refresh(dto: RefreshTokenDto) {
    const tokenHash = hashToken(dto.refresh_token);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.is_revoked || storedToken.expires_at < new Date()) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is invalid, expired, or has been revoked.',
      });
    }

    // Revoke used refresh token (Rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { is_revoked: true },
    });

    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
    );

    return {
      user: this.sanitizeUser(storedToken.user),
      tokens,
    };
  }

  /**
   * Revokes a refresh token on logout.
   */
  async logout(dto: RefreshTokenDto) {
    const tokenHash = hashToken(dto.refresh_token);
    await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash },
      data: { is_revoked: true },
    });
    return { success: true, message: 'Successfully logged out.' };
  }

  private async generateTokens(userId: string, email: string) {
    const accessSecret = this.configService.get<string>(
      'jwt.secret',
      'medusa_super_secret_jwt_access_key_12345',
    );
    const accessExpiresIn = this.configService.get<string>(
      'jwt.expiration',
      '15m',
    );

    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      { secret: accessSecret, expiresIn: accessExpiresIn },
    );

    // Generate random refresh token string
    const rawRefreshToken = `${uuidv4()}-${uuidv4()}`;
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
      expires_in: 900, // 15 minutes in seconds
    };
  }

  private sanitizeUser(user: any) {
    const { password_hash, github_oauth_token_encrypted, ...sanitized } = user;
    return sanitized;
  }
}
