import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getTeamAnalytics(teamId: string, userId: string) {
    const [
      totalMembers,
      tasks,
      milestones,
      files,
      messages,
      progressUpdates,
      recentActivity,
    ] = await Promise.all([
      this.prisma.teamMember.count({ where: { team_id: teamId, status: 'ACTIVE' } }),
      this.prisma.teamTask.findMany({ where: { team_id: teamId }, select: { status: true, due_date: true, created_at: true, updated_at: true } }),
      this.prisma.milestone.findMany({ where: { team_id: teamId }, select: { status: true } }),
      this.prisma.teamFile.count({ where: { team_id: teamId } }),
      this.prisma.teamChatMessage.count({ where: { team_id: teamId, deleted_at: null } }),
      this.prisma.progressUpdate.count({ where: { team_id: teamId } }),
      this.prisma.teamActivity.findMany({
        where: { team_id: teamId },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: { user: { select: { id: true, name: true, avatar_url: true } } },
      }),
    ]);

    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter(t => t.status === 'TODO').length;
    const reviewTasks = tasks.filter(t => t.status === 'REVIEW').length;
    const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'COMPLETED').length;
    const activeMilestones = milestones.filter(m => m.status === 'ONGOING').length;
    const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;

    // Task completion trend (last 7 days)
    const trend = await this.getTaskTrend(teamId);

    // Member productivity
    const memberStats = await this.getMemberProductivity(teamId);

    return {
      overview: {
        totalMembers,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        reviewTasks,
        overdueTasks,
        activeMilestones,
        completedMilestones,
        totalFiles: files,
        totalMessages: messages,
        progressUpdates,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      taskStatusBreakdown: [
        { name: 'To Do', value: todoTasks, color: '#94A3B8' },
        { name: 'In Progress', value: inProgressTasks, color: '#3B82F6' },
        { name: 'Review', value: reviewTasks, color: '#F59E0B' },
        { name: 'Completed', value: completedTasks, color: '#10B981' },
        { name: 'Overdue', value: overdueTasks, color: '#EF4444' },
      ],
      taskTrend: trend,
      memberProductivity: memberStats,
      recentActivity,
    };
  }

  private async getTaskTrend(teamId: string) {
    const days = 14;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [created, completed] = await Promise.all([
        this.prisma.teamTask.count({
          where: { team_id: teamId, created_at: { gte: dayStart, lte: dayEnd } },
        }),
        this.prisma.teamTask.count({
          where: { team_id: teamId, status: 'COMPLETED', updated_at: { gte: dayStart, lte: dayEnd } },
        }),
      ]);

      result.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created,
        completed,
      });
    }
    return result;
  }

  private async getMemberProductivity(teamId: string) {
    const members = await this.prisma.teamMember.findMany({
      where: { team_id: teamId, status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true, avatar_url: true } } },
    });

    const stats = await Promise.all(
      members.map(async (m) => {
        const [assigned, completed, overdue, comments, files, updates] = await Promise.all([
          this.prisma.teamTaskAssignee.count({ where: { user_id: m.user_id, task: { team_id: teamId } } }),
          this.prisma.teamTaskAssignee.count({ where: { user_id: m.user_id, task: { team_id: teamId, status: 'COMPLETED' } } }),
          this.prisma.teamTaskAssignee.count({
            where: {
              user_id: m.user_id,
              task: { team_id: teamId, due_date: { lt: new Date() }, status: { not: 'COMPLETED' } },
            },
          }),
          this.prisma.teamTaskComment.count({ where: { user_id: m.user_id, task: { team_id: teamId } } }),
          this.prisma.teamFile.count({ where: { uploaded_by: m.user_id, team_id: teamId } }),
          this.prisma.progressUpdate.count({ where: { user_id: m.user_id, team_id: teamId } }),
        ]);

        return {
          userId: m.user_id,
          name: m.user.name,
          avatar: m.user.avatar_url,
          role: m.role,
          assigned,
          completed,
          overdue,
          comments,
          files,
          updates,
          completionRate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
        };
      }),
    );

    return stats;
  }

  async getGlobalAnalytics(userId: string) {
    const userTeams = await this.prisma.teamMember.findMany({
      where: { user_id: userId, status: 'ACTIVE' },
      select: { team_id: true },
    });
    const teamIds = userTeams.map(t => t.team_id);

    const [totalTeams, totalTasks, completedTasks, overdueTasks, totalFiles, notifications] = await Promise.all([
      Promise.resolve(teamIds.length),
      this.prisma.teamTask.count({ where: { team_id: { in: teamIds } } }),
      this.prisma.teamTask.count({ where: { team_id: { in: teamIds }, status: 'COMPLETED' } }),
      this.prisma.teamTask.count({
        where: { team_id: { in: teamIds }, due_date: { lt: new Date() }, status: { not: 'COMPLETED' } },
      }),
      this.prisma.teamFile.count({ where: { team_id: { in: teamIds } } }),
      this.prisma.notification.count({ where: { user_id: userId, read: false } }),
    ]);

    return {
      totalTeams,
      totalTasks,
      completedTasks,
      overdueTasks,
      pendingTasks: totalTasks - completedTasks - overdueTasks,
      totalFiles,
      unreadNotifications: notifications,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }
}
