import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BugsService {
  constructor(private prisma: PrismaService) {}

  private async assertNotStudent(userId: string) {
    const roles = await this.prisma.userRole.findMany({ where: { user_id: userId }, include: { role: true } });
    if (roles.some(r => r.role.name.toUpperCase() === 'STUDENT')) throw new ForbiddenException('Company feature only');
    return roles.map(r => r.role.name.toUpperCase());
  }

  async create(userId: string, dto: any) {
    await this.assertNotStudent(userId);
    return this.prisma.bug.create({
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity || 'MEDIUM',
        priority: dto.priority || 'MEDIUM',
        reported_by: userId,
        assigned_to: dto.assigned_to,
        team_id: dto.team_id,
        task_id: dto.task_id,
        environment: dto.environment,
        steps_to_reproduce: dto.steps_to_reproduce,
        expected_behavior: dto.expected_behavior,
        actual_behavior: dto.actual_behavior,
      },
      include: {
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(userId: string, filters: any = {}) {
    const roles = await this.assertNotStudent(userId);
    const isPrivileged = roles.some(r => ['MANAGER', 'ADMIN'].includes(r));
    const where: any = {};
    if (!isPrivileged) where.OR = [{ reported_by: userId }, { assigned_to: userId }];
    if (filters.status) where.status = filters.status;
    if (filters.severity) where.severity = filters.severity;
    if (filters.team_id) where.team_id = filters.team_id;

    return this.prisma.bug.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    await this.assertNotStudent(userId);
    const bug = await this.prisma.bug.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        comments: { include: { user: { select: { id: true, name: true, avatar_url: true } } }, orderBy: { created_at: 'asc' } },
      },
    });
    if (!bug) throw new NotFoundException('Bug not found');
    return bug;
  }

  async update(id: string, userId: string, dto: any) {
    await this.assertNotStudent(userId);
    return this.prisma.bug.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        priority: dto.priority,
        status: dto.status,
        assigned_to: dto.assigned_to,
        environment: dto.environment,
        steps_to_reproduce: dto.steps_to_reproduce,
        expected_behavior: dto.expected_behavior,
        actual_behavior: dto.actual_behavior,
      },
      include: { reporter: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } },
    });
  }

  async addComment(bugId: string, userId: string, body: string) {
    await this.assertNotStudent(userId);
    return this.prisma.bugComment.create({
      data: { bug_id: bugId, user_id: userId, body },
      include: { user: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  async deleteBug(id: string, userId: string) {
    const roles = await this.assertNotStudent(userId);
    const isPrivileged = roles.some(r => ['MANAGER', 'ADMIN'].includes(r));
    const bug = await this.prisma.bug.findUnique({ where: { id } });
    if (!bug) throw new NotFoundException('Bug not found');
    if (!isPrivileged && bug.reported_by !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.bug.delete({ where: { id } });
    return { message: 'Bug deleted' };
  }
}
