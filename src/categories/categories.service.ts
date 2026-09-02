import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

export const DEFAULT_CATEGORIES = [
  { name: 'AI & ML', slug: 'AI_ML', icon: 'brain', color_token: 'purple', priority: 1 },
  { name: 'Backend', slug: 'BACKEND', icon: 'server', color_token: 'emerald', priority: 2 },
  { name: 'DevOps', slug: 'DEVOPS', icon: 'terminal', color_token: 'blue', priority: 3 },
  { name: 'System Design', slug: 'SYSTEM_DESIGN', icon: 'network', color_token: 'indigo', priority: 4 },
  { name: 'C++', slug: 'CPP', icon: 'code', color_token: 'cyan', priority: 5 },
  { name: 'Open Source', slug: 'OPEN_SOURCE', icon: 'git-pull-request', color_token: 'teal', priority: 6 },
  { name: 'GitHub', slug: 'GITHUB', icon: 'github', color_token: 'slate', priority: 7 },
  { name: 'Academics', slug: 'ACADEMICS', icon: 'book', color_token: 'amber', priority: 8 },
  { name: 'Gym', slug: 'GYM', icon: 'dumbbell', color_token: 'red', priority: 9 },
  { name: 'Mind', slug: 'MIND', icon: 'lotus', color_token: 'sky', priority: 10 },
  { name: 'Reading', slug: 'READING', icon: 'book-open', color_token: 'yellow', priority: 11 },
  { name: 'Freelancing', slug: 'FREELANCING', icon: 'briefcase', color_token: 'orange', priority: 12 },
  { name: 'Project', slug: 'PROJECT', icon: 'folder', color_token: 'violet', priority: 13 },
  { name: 'Other', slug: 'OTHER', icon: 'more-horizontal', color_token: 'gray', priority: 14 },
];

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(userId: string) {
    // Return system categories (user_id is null) + user custom categories
    return this.prisma.category.findMany({
      where: {
        OR: [{ user_id: null }, { user_id: userId }],
      },
      orderBy: { priority: 'asc' },
    });
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: {
        user_id: userId,
        slug: dto.slug.toUpperCase(),
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'CATEGORY_SLUG_EXISTS',
        message: `Category with slug ${dto.slug} already exists`,
      });
    }

    return this.prisma.category.create({
      data: {
        user_id: userId,
        name: dto.name,
        slug: dto.slug.toUpperCase(),
        icon: dto.icon || null,
        color_token: dto.color_token || null,
        priority: dto.priority ?? 0,
        weekly_target_minutes: dto.weekly_target_minutes ?? 0,
      },
    });
  }

  async ensureDefaultCategories() {
    for (const cat of DEFAULT_CATEGORIES) {
      await this.prisma.category.upsert({
        where: {
          user_id_slug: {
            user_id: null,
            slug: cat.slug,
          },
        },
        create: {
          user_id: null,
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          color_token: cat.color_token,
          priority: cat.priority,
        },
        update: {},
      });
    }
  }
}
