import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword } from '../common/utils/crypto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        arcs: { orderBy: { created_at: 'desc' } },
        user_stats: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    const { password_hash, github_oauth_token_encrypted, ...sanitized } = user;
    return sanitized;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    let passwordHash: string | undefined = undefined;
    if (dto.password) {
      passwordHash = await hashPassword(dto.password);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        timezone: dto.timezone,
        commitment_phrase: dto.commitment_phrase,
        github_username: dto.github_username,
        password_hash: passwordHash,
      },
    });

    const { password_hash, github_oauth_token_encrypted, ...sanitized } = user;
    return sanitized;
  }
}
