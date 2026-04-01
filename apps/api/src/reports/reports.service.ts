import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async assertMember(teamId: string, userId: string) {
    const m = await this.prisma.teamMember.findFirst({ where: { team_id: teamId, user_id: userId, status: 'ACTIVE' } });
    if (!m) throw new ForbiddenException('Not a team member');
    return m;
  }

  async generateReport(teamId: string, userId: string, dto: any) {
    await this.assertMember(teamId, userId);
    const { report_type, filters = {} } = dto;
    let data: any = {};

    switch (report_type) {
      case 'TASK':
        data = await this.buildTaskReport(teamId, filters);
        break;
      case 'TEAM_PROGRESS':
        data = await this.buildTeamProgressReport(teamId, filters);
        break;
      case 'MEMBER_PERFORMANCE':
        data = await this.buildMemberPerformanceReport(teamId, filters);
        break;
      case 'DEADLINE':
        data = await this.buildDeadlineReport(teamId, filters);
        break;
      case 'MILESTONE':
        data = await this.buildMilestoneReport(teamId, filters);
        break;
      case 'FILE_ACTIVITY':
        data = await this.buildFileActivityReport(teamId, filters);
        break;
      default:
        data = await this.buildTaskReport(teamId, filters);
    }

    const report = await this.prisma.generatedReport.create({
      data: {
        team_id: teamId,
        created_by: userId,
        title: dto.title || `${report_type} Report`,
        report_type,
        filters,
        data,
      },
    });

    return report;
  }

  async getReports(teamId: string, userId: string) {
    await this.assertMember(teamId, userId);
    return this.prisma.generatedReport.findMany({
      where: { team_id: teamId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getReport(reportId: string, userId: string) {
    const report = await this.prisma.generatedReport.findUnique({ where: { id: reportId } });
    if (!report) throw new ForbiddenException('Report not found');
    if (report.team_id) await this.assertMember(report.team_id, userId);
    return report;
  }

  private async buildTaskReport(teamId: string, filters: any) {
    const where: any = { team_id: teamId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.from) where.created_at = { gte: new Date(filters.from) };
    if (filters.to) where.created_at = { ...where.created_at, lte: new Date(filters.to) };

    const tasks = await this.prisma.teamTask.findMany({
      where,
      include: {
        assignees: { include: { user: { select: { id: true, name: true } } } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const now = new Date();
    const summary = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'COMPLETED').length,
    };

    return { summary, tasks };
  }

  private async buildTeamProgressReport(teamId: string, filters: any) {
    const [tasks, milestones, updates, members] = await Promise.all([
      this.prisma.teamTask.findMany({ where: { team_id: teamId }, select: { status: true, due_date: true } }),
      this.prisma.milestone.findMany({ where: { team_id: teamId }, include: { tasks: true } }),
      this.prisma.progressUpdate.findMany({
        where: { team_id: teamId },
        orderBy: { created_at: 'desc' },
        take: 20,
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.teamMember.count({ where: { team_id: teamId, status: 'ACTIVE' } }),
    ]);

    const now = new Date();
    return {
      summary: {
        totalMembers: members,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
        overdueTasks: tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'COMPLETED').length,
        completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) : 0,
      },
      milestones,
      recentUpdates: updates,
    };
  }

  private async buildMemberPerformanceReport(teamId: string, filters: any) {
    const members = await this.prisma.teamMember.findMany({
      where: { team_id: teamId, status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    const now = new Date();
    const stats = await Promise.all(
      members.map(async (m) => {
        const [assigned, completed, overdue, comments, files, updates] = await Promise.all([
          this.prisma.teamTaskAssignee.count({ where: { user_id: m.user_id, task: { team_id: teamId } } }),
          this.prisma.teamTaskAssignee.count({ where: { user_id: m.user_id, task: { team_id: teamId, status: 'COMPLETED' } } }),
          this.prisma.teamTaskAssignee.count({
            where: { user_id: m.user_id, task: { team_id: teamId, due_date: { lt: now }, status: { not: 'COMPLETED' } } },
          }),
          this.prisma.teamTaskComment.count({ where: { user_id: m.user_id, task: { team_id: teamId } } }),
          this.prisma.teamFile.count({ where: { uploaded_by: m.user_id, team_id: teamId } }),
          this.prisma.progressUpdate.count({ where: { user_id: m.user_id, team_id: teamId } }),
        ]);
        return {
          user: m.user,
          role: m.role,
          assigned, completed, overdue, comments, files, updates,
          completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
        };
      }),
    );

    return { members: stats };
  }

  private async buildDeadlineReport(teamId: string, filters: any) {
    const now = new Date();
    const tasks = await this.prisma.teamTask.findMany({
      where: { team_id: teamId, due_date: { not: null } },
      include: { assignees: { include: { user: { select: { id: true, name: true } } } } },
      orderBy: { due_date: 'asc' },
    });

    return {
      overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'COMPLETED'),
      dueToday: tasks.filter(t => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d.toDateString() === now.toDateString() && t.status !== 'COMPLETED';
      }),
      upcoming: tasks.filter(t => t.due_date && new Date(t.due_date) > now && t.status !== 'COMPLETED'),
      completed: tasks.filter(t => t.status === 'COMPLETED'),
    };
  }

  private async buildMilestoneReport(teamId: string, filters: any) {
    const milestones = await this.prisma.milestone.findMany({
      where: { team_id: teamId },
      include: {
        tasks: { include: { task: { select: { id: true, title: true, status: true } } } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { target_date: 'asc' },
    });

    return {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'COMPLETED').length,
      ongoing: milestones.filter(m => m.status === 'ONGOING').length,
      notStarted: milestones.filter(m => m.status === 'NOT_STARTED').length,
      milestones,
    };
  }

  private async buildFileActivityReport(teamId: string, filters: any) {
    const files = await this.prisma.teamFile.findMany({
      where: { team_id: teamId },
      include: { uploader: { select: { id: true, name: true } }, folder: { select: { id: true, name: true } } },
      orderBy: { created_at: 'desc' },
    });

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    return {
      summary: { totalFiles: files.length, totalSize, totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100 },
      files,
    };
  }
}
