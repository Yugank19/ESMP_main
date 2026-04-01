import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkloadService {
  constructor(private prisma: PrismaService) {}

  private async assertNotStudent(userId: string) {
    const roles = await this.prisma.userRole.findMany({ where: { user_id: userId }, include: { role: true } });
    if (roles.some(r => r.role.name.toUpperCase() === 'STUDENT')) throw new ForbiddenException('Company feature only');
    return roles.map(r => r.role.name.toUpperCase());
  }

  async getTeamWorkload(teamId: string, userId: string) {
    const roles = await this.assertNotStudent(userId);
    const isPrivileged = roles.some(r => ['MANAGER', 'ADMIN'].includes(r));

    const members = await this.prisma.teamMember.findMany({
      where: { team_id: teamId, status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } },
    });

    const now = new Date();
    const workload = await Promise.all(members.map(async m => {
      const [activeTasks, overdueTasks, openTickets, hoursThisWeek] = await Promise.all([
        this.prisma.teamTaskAssignee.count({
          where: { user_id: m.user_id, task: { team_id: teamId, status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] } } },
        }),
        this.prisma.teamTaskAssignee.count({
          where: { user_id: m.user_id, task: { team_id: teamId, due_date: { lt: now }, status: { not: 'COMPLETED' } } },
        }),
        this.prisma.ticket.count({
          where: { assigned_to: m.user_id, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        }),
        this.prisma.timeEntry.aggregate({
          where: {
            user_id: m.user_id,
            date: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1) },
          },
          _sum: { hours: true },
        }),
      ]);

      const totalLoad = activeTasks + openTickets;
      const capacity = 8; // hours/day
      const utilization = Math.min(Math.round((totalLoad / 5) * 100), 100); // rough %

      return {
        user: m.user,
        role: m.role,
        activeTasks,
        overdueTasks,
        openTickets,
        hoursThisWeek: hoursThisWeek._sum.hours || 0,
        utilization,
        status: utilization > 80 ? 'OVERLOADED' : utilization > 50 ? 'BUSY' : 'AVAILABLE',
      };
    }));

    return { teamId, members: workload };
  }

  async getMyWorkload(userId: string) {
    await this.assertNotStudent(userId);
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);

    const [activeTasks, overdueTasks, openTickets, pendingApprovals, hoursThisWeek, recentEntries] = await Promise.all([
      this.prisma.teamTaskAssignee.findMany({
        where: { user_id: userId, task: { status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] } } },
        include: { task: { select: { id: true, title: true, status: true, priority: true, due_date: true, team: { select: { name: true } } } } },
        take: 10,
      }),
      this.prisma.teamTaskAssignee.count({
        where: { user_id: userId, task: { due_date: { lt: now }, status: { not: 'COMPLETED' } } },
      }),
      this.prisma.ticket.count({ where: { created_by: userId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.approvalStep.count({ where: { approver_id: userId, status: 'PENDING' } }),
      this.prisma.timeEntry.aggregate({
        where: { user_id: userId, date: { gte: weekStart } },
        _sum: { hours: true },
      }),
      this.prisma.timeEntry.findMany({
        where: { user_id: userId },
        orderBy: { date: 'desc' },
        take: 7,
      }),
    ]);

    return {
      activeTasks: activeTasks.map(a => a.task),
      overdueTasks,
      openTickets,
      pendingApprovals,
      hoursThisWeek: hoursThisWeek._sum.hours || 0,
      recentTimeEntries: recentEntries,
    };
  }
}
