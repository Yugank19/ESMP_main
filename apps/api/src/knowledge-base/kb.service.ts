import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KbService {
  constructor(private prisma: PrismaService) {}

  private async assertNotStudent(userId: string) {
    const roles = await this.prisma.userRole.findMany({ where: { user_id: userId }, include: { role: true } });
    if (roles.some(r => r.role.name.toUpperCase() === 'STUDENT')) throw new ForbiddenException('Company feature only');
    return roles.map(r => r.role.name.toUpperCase());
  }

  private slugify(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  }

  async create(userId: string, dto: any) {
    const roles = await this.assertNotStudent(userId);
    if (!roles.some(r => ['MANAGER', 'ADMIN'].includes(r))) throw new ForbiddenException('Managers/Admins only');
    return this.prisma.kbArticle.create({
      data: {
        title: dto.title,
        slug: this.slugify(dto.title),
        body: dto.body,
        category: dto.category || 'GENERAL',
        tags: dto.tags,
        is_published: dto.is_published || false,
        is_pinned: dto.is_pinned || false,
        author_id: userId,
      },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async findAll(userId: string, filters: any = {}) {
    await this.assertNotStudent(userId);
    const where: any = { is_published: true };
    if (filters.category) where.category = filters.category;
    if (filters.search) where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { body: { contains: filters.search, mode: 'insensitive' } },
      { tags: { contains: filters.search, mode: 'insensitive' } },
    ];
    return this.prisma.kbArticle.findMany({
      where,
      include: { author: { select: { id: true, name: true } } },
      orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
    });
  }

  async findOne(id: string, userId: string) {
    await this.assertNotStudent(userId);
    const article = await this.prisma.kbArticle.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true } } },
    });
    if (!article) throw new NotFoundException('Article not found');
    await this.prisma.kbArticle.update({ where: { id }, data: { views: { increment: 1 } } });
    return article;
  }

  async update(id: string, userId: string, dto: any) {
    const roles = await this.assertNotStudent(userId);
    if (!roles.some(r => ['MANAGER', 'ADMIN'].includes(r))) throw new ForbiddenException('Managers/Admins only');
    return this.prisma.kbArticle.update({
      where: { id },
      data: { title: dto.title, body: dto.body, category: dto.category, tags: dto.tags, is_published: dto.is_published, is_pinned: dto.is_pinned },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async getCategories(userId: string) {
    await this.assertNotStudent(userId);
    const cats = await this.prisma.kbArticle.findMany({ where: { is_published: true }, select: { category: true }, distinct: ['category'] });
    return cats.map(c => c.category);
  }
}
