import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  private async assertNotStudent(userId: string) {
    const roles = await this.prisma.userRole.findMany({ where: { user_id: userId }, include: { role: true } });
    if (roles.some(r => r.role.name.toUpperCase() === 'STUDENT')) throw new ForbiddenException('Company feature only');
    return roles.map(r => r.role.name.toUpperCase());
  }

  async logTime(userId: string, dto: any) {
    await this.assertNotStudent(userId);
    return this.prisma.timeEntry.create({
      data: {
        user_id: userId,
        task_id: dto.task_id,
        ticket_id: dto.ticket_id,
        description: dto.description,
        date: new Date(dto.date),
        hours: parseFloat(dto.hours),
        is_billable: dto.is_billable || false,
        started_at: dto.started_at ? new Date(dto.started_at) : undefined,
        ended_at: dto.ended_at ? new Date(dto.ended_at) : undefined,
      },
    });
  }

  async getMyEntries(userId: string, from?: string, to?: string) {
    await this.assertNotStudent(userId);
    const where: any = { user_id: userId };
    if (from) where.date = { gte: new Date(from) };
    if (to) where.date = { ...where.date, lte: new Date(to) };
    return this.prisma.timeEntry.findMany({ where, orderBy: { date: 'desc' } });
  }

  async getWeeklySheet(userId: string) {
    await this.assertNotStudent(userId);
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const entries = await this.prisma.timeEntry.findMany({
      where: { user_id: userId, date: { gte: monday, lte: sunday } },
      orderBy: { date: 'asc' },
    });

    const totalHours = entries.reduce((s, e) => s + e.hours, 0);
    return { entries, totalHours, weekStart: monday, weekEnd: sunday };
  }

  async getTeamSummary(userId: string, teamId: string) {
    const roles = await this.assertNotStudent(userId);
    if (!roles.some(r => ['MANAGER', 'ADMIN'].includes(r))) throw new ForbiddenException('Managers only');

    const members = await this.prisma.teamMember.findMany({
      where: { team_id: teamId, status: 'ACTIVE' },
      select: { user_id: true, user: { select: { id: true, name: true } } },
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const summary = await Promise.all(members.map(async m => {
      const entries = await this.prisma.timeEntry.findMany({
        where: { user_id: m.user_id, date: { gte: monthStart } },
      });
      const totalHours = entries.reduce((s, e) => s + e.hours, 0);
      return { user: m.user, totalHours, entryCount: entries.length };
    }));

    return summary;
  }

  async deleteEntry(id: string, userId: string) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    if (entry.user_id !== userId) throw new ForbiddenException('Not your entry');
    return this.prisma.timeEntry.delete({ where: { id } });
  }
}
