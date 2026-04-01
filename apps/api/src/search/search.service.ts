import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(userId: string, query: string, options: {
    teamId?: string;
    type?: string;
    status?: string;
    priority?: string;
    from?: string;
    to?: string;
    sort?: string;
    limit?: number;
  } = {}) {
    if (!query || query.trim().length < 2) return { query, results: {}, total: 0 };

    const q = query.trim();
    const { teamId, type, status, priority, from, to, sort = 'newest', limit = 10 } = options;

    const memberships = await this.prisma.teamMember.findMany({
      where: { user_id: userId, status: 'ACTIVE', ...(teamId ? { team_id: teamId } : {}) },
      select: { team_id: true },
    });
    const teamIds = memberships.map(m => m.team_id);

    const dateFilter: any = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to);
    const hasDate = Object.keys(dateFilter).length > 0;

    const orderBy = sort === 'asc' ? { created_at: 'asc' as const }
      : sort === 'alpha' ? { title: 'asc' as const }
      : { created_at: 'desc' as const };

    const shouldSearch = (t: string) => !type || type === t;

    const [tasks, files, messages, announcements, milestones, members, teams, reports, logs] = await Promise.all([
      shouldSearch('task') ? this.prisma.teamTask.findMany({
        where: {
          team_id: { in: teamIds },
          OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }],
          ...(status ? { status } : {}),
          ...(priority ? { priority } : {}),
          ...(hasDate ? { created_at: dateFilter } : {}),
        },
        select: { id: true, title: true, status: true, priority: true, team_id: true, due_date: true, created_at: true },
        orderBy: sort === 'deadline' ? { due_date: 'asc' } : sort === 'priority' ? { priority: 'asc' } : orderBy,
        take: limit,
      }) : Promise.resolve([]),

      shouldSearch('file') ? this.prisma.teamFile.findMany({
        where: {
          team_id: { in: teamIds },
          OR: [{ name: { contains: q, mode: 'insensitive' } }, { original_name: { contains: q, mode: 'insensitive' } }],
          ...(hasDate ? { created_at: dateFilter } : {}),
        },
        select: { id: true, name: true, original_name: true, mime_type: true, team_id: true, file_url: true, created_at: true, size: true },
        orderBy,
        take: limit,
      }) : Promise.resolve([]),

      shouldSearch('message') ? this.prisma.teamChatMessage.findMany({
        where: {
          team_id: { in: teamIds },
          deleted_at: null,
          body: { contains: q, mode: 'insensitive' },
          ...(hasDate ? { created_at: dateFilter } : {}),
        },
        select: { id: true, body: true, team_id: true, created_at: true, sender: { select: { id: true, name: true } } },
        orderBy,
        take: limit,
      }) : Promise.resolve([]),

      shouldSearch('announcement') ? this.prisma.teamAnnouncement.findMany({
        where: {
          team_id: { in: teamIds },
          OR: [{ title: { contains: q, mode: 'insensitive' } }, { body: { contains: q, mode: 'insensitive' } }],
          ...(hasDate ? { created_at: dateFilter } : {}),
        },
        select: { id: true, title: true, team_id: true, created_at: true, author: { select: { name: true } } },
        orderBy,
        take: limit,
      }) : Promise.resolve([]),

      shouldSearch('milestone') ? this.prisma.milestone.findMany({
        where: {
          team_id: { in: teamIds },
          OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }],
          ...(status ? { status } : {}),
          ...(hasDate ? { created_at: dateFilter } : {}),
        },
        select: { id: true, name: true, status: true, team_id: true, target_date: true, created_at: true },
        orderBy,
        take: limit,
      }) : Promise.resolve([]),

      shouldSearch('member') ? this.prisma.teamMember.findMany({
        where: {
          team_id: { in: teamIds },
          status: 'ACTIVE',
          user: { name: { contains: q, mode: 'insensitive' } },
        },
        select: { user: { select: { id: true, name: true, email: true, avatar_url: true } }, team_id: true, role: true },
        take: limit,
      }) : Promise.resolve([]),

      shouldSearch('team') ? this.prisma.team.findMany({
        where: {
          id: { in: teamIds },
          OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }],
        },
        select: { id: true, name: true, description: true, status: true, created_at: true },
        take: limit,
      }) : Promise.resolve([]),

      shouldSearch('report') ? this.prisma.generatedReport.findMany({
        where: {
          OR: [
            { team_id: { in: teamIds } },
            { created_by: userId },
          ],
          title: { contains: q, mode: 'insensitive' },
          ...(hasDate ? { created_at: dateFilter } : {}),
        },
        select: { id: true, title: true, report_type: true, created_at: true, team_id: true },
        orderBy,
        take: limit,
      }) : Promise.resolve([]),

      shouldSearch('log') ? this.prisma.teamActivity.findMany({
        where: {
          team_id: { in: teamIds },
          OR: [
            { action: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
          ...(hasDate ? { created_at: dateFilter } : {}),
        },
        select: { id: true, action: true, description: true, team_id: true, created_at: true, user: { select: { name: true } } },
        orderBy,
        take: limit,
      }) : Promise.resolve([]),
    ]);

    const results = {
      tasks: tasks.map(t => ({ ...t, type: 'task' })),
      files: files.map(f => ({ ...f, type: 'file' })),
      messages: messages.map(m => ({ ...m, type: 'message' })),
      announcements: announcements.map(a => ({ ...a, type: 'announcement' })),
      milestones: milestones.map(m => ({ ...m, type: 'milestone' })),
      members: members.map(m => ({ ...m.user, team_id: m.team_id, role: m.role, type: 'member' })),
      teams: teams.map(t => ({ ...t, type: 'team' })),
      reports: reports.map(r => ({ ...r, type: 'report' })),
      logs: logs.map(l => ({ ...l, type: 'log' })),
    };

    const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
    return { query, results, total };
  }
}
