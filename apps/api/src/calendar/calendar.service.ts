import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  private async assertMember(teamId: string, userId: string) {
    const m = await this.prisma.teamMember.findFirst({ where: { team_id: teamId, user_id: userId, status: 'ACTIVE' } });
    if (!m) throw new ForbiddenException('Not a team member');
    return m;
  }

  async getTeamEvents(teamId: string, userId: string, from?: string, to?: string) {
    await this.assertMember(teamId, userId);

    const where: any = { team_id: teamId };
    if (from || to) {
      where.start_date = {};
      if (from) where.start_date.gte = new Date(from);
      if (to) where.start_date.lte = new Date(to);
    }

    // Fetch manual calendar events
    const events = await this.prisma.calendarEvent.findMany({ where, orderBy: { start_date: 'asc' } });

    // Also pull task deadlines as events
    const tasks = await this.prisma.teamTask.findMany({
      where: { team_id: teamId, due_date: { not: null }, ...(from ? { due_date: { gte: new Date(from) } } : {}), ...(to ? { due_date: { lte: new Date(to) } } : {}) },
      select: { id: true, title: true, due_date: true, status: true, priority: true },
    });

    const milestones = await this.prisma.milestone.findMany({
      where: { team_id: teamId, target_date: { not: null } },
      select: { id: true, name: true, target_date: true, status: true },
    });

    const taskEvents = tasks.map(t => ({
      id: `task-${t.id}`,
      title: t.title,
      type: 'DEADLINE',
      start_date: t.due_date,
      end_date: t.due_date,
      color: t.status === 'COMPLETED' ? '#10B981' : t.priority === 'HIGH' || t.priority === 'URGENT' ? '#EF4444' : '#F59E0B',
      source: 'task',
    }));

    const milestoneEvents = milestones.map(m => ({
      id: `milestone-${m.id}`,
      title: m.name,
      type: 'MILESTONE',
      start_date: m.target_date,
      end_date: m.target_date,
      color: '#8B5CF6',
      source: 'milestone',
    }));

    return [...events.map(e => ({ ...e, source: 'manual' })), ...taskEvents, ...milestoneEvents];
  }

  async createEvent(teamId: string, userId: string, dto: any) {
    const m = await this.assertMember(teamId, userId);
    if (m.role !== 'LEADER' && m.role !== 'REVIEWER') throw new ForbiddenException('Only leaders can create events');

    return this.prisma.calendarEvent.create({
      data: {
        team_id: teamId,
        created_by: userId,
        title: dto.title,
        description: dto.description,
        type: dto.type || 'EVENT',
        start_date: new Date(dto.start_date),
        end_date: dto.end_date ? new Date(dto.end_date) : null,
        all_day: dto.all_day || false,
        color: dto.color,
      },
    });
  }

  async updateEvent(eventId: string, userId: string, dto: any) {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.created_by !== userId) throw new ForbiddenException('Not authorized');

    return this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        all_day: dto.all_day,
        color: dto.color,
      },
    });
  }

  async deleteEvent(eventId: string, userId: string) {
    const event = await this.prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.created_by !== userId) throw new ForbiddenException('Not authorized');
    return this.prisma.calendarEvent.delete({ where: { id: eventId } });
  }
}
