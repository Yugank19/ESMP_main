import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditAction =
  | 'LOGIN' | 'LOGOUT' | 'REGISTER'
  | 'TEAM_CREATED' | 'TEAM_UPDATED' | 'TEAM_DELETED' | 'TEAM_ARCHIVED'
  | 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'MEMBER_REMOVED' | 'MEMBER_INVITED' | 'ROLE_UPDATED'
  | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED' | 'TASK_ASSIGNED' | 'TASK_COMPLETED'
  | 'FILE_UPLOADED' | 'FILE_DELETED' | 'FILE_RENAMED' | 'FILE_DOWNLOADED'
  | 'MESSAGE_SENT' | 'MESSAGE_EDITED' | 'MESSAGE_DELETED'
  | 'ANNOUNCEMENT_POSTED' | 'ANNOUNCEMENT_EDITED'
  | 'REPORT_GENERATED'
  | 'SETTINGS_CHANGED' | 'PASSWORD_CHANGED' | 'PROFILE_UPDATED'
  | 'MILESTONE_CREATED' | 'MILESTONE_UPDATED' | 'MILESTONE_DELETED'
  | 'PROGRESS_UPDATED' | 'INVITE_CODE_REGENERATED'
  | string;

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string,
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    change?: any,
    ip?: string,
  ) {
    try {
      return await this.prisma.auditLog.create({
        data: { user_id: userId, action, resource_type: resourceType, resource_id: resourceId, change, ip },
      });
    } catch {
      // Never let audit logging crash the main flow
    }
  }

  async getLogs(userId: string, filters: any = {}) {
    const where: any = {};

    const userRoles = await this.prisma.userRole.findMany({
      where: { user_id: userId },
      include: { role: true },
    });
    const isAdmin = userRoles.some(r => ['ADMIN', 'MANAGER'].includes(r.role.name));

    if (!isAdmin) {
      where.user_id = userId;
    } else if (filters.userId) {
      where.user_id = filters.userId;
    }

    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.resourceType) where.resource_type = filters.resourceType;
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { resource_type: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const dateFilter: any = {};
    if (filters.from) dateFilter.gte = new Date(filters.from);
    if (filters.to) dateFilter.lte = new Date(filters.to);
    if (Object.keys(dateFilter).length) where.created_at = dateFilter;

    const orderBy = filters.sort === 'asc' ? { created_at: 'asc' as const } : { created_at: 'desc' as const };

    return this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy,
      take: filters.limit ? Math.min(parseInt(filters.limit), 500) : 200,
    });
  }

  async getTeamAuditLogs(teamId: string, userId: string, filters: any = {}) {
    const m = await this.prisma.teamMember.findFirst({
      where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
    });
    if (!m) return [];

    const where: any = { team_id: teamId };
    if (filters.userId) where.user_id = filters.userId;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const dateFilter: any = {};
    if (filters.from) dateFilter.gte = new Date(filters.from);
    if (filters.to) dateFilter.lte = new Date(filters.to);
    if (Object.keys(dateFilter).length) where.created_at = dateFilter;

    const orderBy = filters.sort === 'asc' ? { created_at: 'asc' as const } : { created_at: 'desc' as const };

    return this.prisma.teamActivity.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar_url: true, email: true } } },
      orderBy,
      take: filters.limit ? Math.min(parseInt(filters.limit), 500) : 200,
    });
  }

  async getSystemLogs(userId: string, filters: any = {}) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { user_id: userId },
      include: { role: true },
    });
    const isAdmin = userRoles.some(r => ['ADMIN', 'MANAGER'].includes(r.role.name));
    if (!isAdmin) return [];

    const where: any = {};
    if (filters.userId) where.user_id = filters.userId;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { resource_type: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const dateFilter: any = {};
    if (filters.from) dateFilter.gte = new Date(filters.from);
    if (filters.to) dateFilter.lte = new Date(filters.to);
    if (Object.keys(dateFilter).length) where.created_at = dateFilter;

    return this.prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { created_at: 'desc' },
      take: 500,
    });
  }

  async getActionTypes() {
    const actions = await this.prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });
    return actions.map(a => a.action);
  }
}
