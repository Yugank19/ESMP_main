import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompanyAnnouncementsService {
  constructor(private prisma: PrismaService) {}

  private async assertNotStudent(userId: string) {
    const roles = await this.prisma.userRole.findMany({ where: { user_id: userId }, include: { role: true } });
    if (roles.some(r => r.role.name.toUpperCase() === 'STUDENT')) throw new ForbiddenException('Company feature only');
    return roles.map(r => r.role.name.toUpperCase());
  }

  async create(userId: string, dto: any) {
    const roles = await this.assertNotStudent(userId);
    if (!roles.some(r => ['MANAGER', 'ADMIN'].includes(r))) throw new ForbiddenException('Managers/Admins only');
    const ann = await this.prisma.companyAnnouncement.create({
      data: {
        title: dto.title,
        body: dto.body,
        type: dto.type || 'GENERAL',
        target_role: dto.target_role,
        is_pinned: dto.is_pinned || false,
        author_id: userId,
        expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    // Notify all non-student users
    const users = await this.prisma.userRole.findMany({
      where: { role: { name: { not: 'STUDENT' } }, ...(dto.target_role ? { role: { name: dto.target_role } } : {}) },
      select: { user_id: true },
      distinct: ['user_id'],
    });
    if (users.length) {
      await this.prisma.notification.createMany({
        data: users.map(u => ({
          user_id: u.user_id,
          type: 'ANNOUNCEMENT',
          payload: { announcement_id: ann.id, title: ann.title, type: ann.type },
        })),
        skipDuplicates: true,
      });
    }
    return ann;
  }

  async findAll(userId: string, filters: any = {}) {
    const roles = await this.assertNotStudent(userId);
    const userRole = roles[0];
    const now = new Date();
    const where: any = {
      OR: [{ target_role: null }, { target_role: userRole }],
      AND: [{ OR: [{ expires_at: null }, { expires_at: { gt: now } }] }],
    };
    if (filters.type) where.type = filters.type;
    return this.prisma.companyAnnouncement.findMany({
      where,
      include: { author: { select: { id: true, name: true } } },
      orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
    });
  }

  async update(id: string, userId: string, dto: any) {
    const roles = await this.assertNotStudent(userId);
    if (!roles.some(r => ['MANAGER', 'ADMIN'].includes(r))) throw new ForbiddenException('Managers/Admins only');
    return this.prisma.companyAnnouncement.update({
      where: { id },
      data: { title: dto.title, body: dto.body, type: dto.type, is_pinned: dto.is_pinned, expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined },
      include: { author: { select: { id: true, name: true } } },
    });
  }
}
