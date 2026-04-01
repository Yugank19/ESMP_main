import {
    Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateTeamTaskDto, UpdateTeamTaskDto, AddTaskCommentDto,
    CreateMilestoneDto, UpdateMilestoneDto, CreateProgressUpdateDto,
} from '@esmp/shared';

@Injectable()
export class TeamTasksService {
    constructor(private prisma: PrismaService) {}

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async assertMember(teamId: string, userId: string) {
        const m = await this.prisma.teamMember.findUnique({
            where: { team_id_user_id: { team_id: teamId, user_id: userId } },
        });
        if (!m || m.status !== 'ACTIVE') throw new ForbiddenException('Not a team member');
        return m;
    }

    private async assertLeader(teamId: string, userId: string) {
        const m = await this.assertMember(teamId, userId);
        if (m.role !== 'LEADER') throw new ForbiddenException('Only the team leader can perform this action');
    }

    private taskInclude = {
        assignees: { include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } } },
        creator: { select: { id: true, name: true, email: true } },
        comments: {
            include: { user: { select: { id: true, name: true, avatar_url: true } } },
            orderBy: { created_at: 'asc' as const },
        },
        history: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { created_at: 'desc' as const },
            take: 20,
        },
    };

    // ── Tasks CRUD ────────────────────────────────────────────────────────────

    async createTask(teamId: string, userId: string, dto: CreateTeamTaskDto) {
        await this.assertLeader(teamId, userId);

        const task = await this.prisma.teamTask.create({
            data: {
                team_id: teamId,
                title: dto.title,
                description: dto.description,
                priority: dto.priority || 'MEDIUM',
                status: 'TODO',
                start_date: dto.start_date ? new Date(dto.start_date) : undefined,
                due_date: dto.due_date ? new Date(dto.due_date) : undefined,
                estimate_hours: dto.estimate_hours,
                created_by: userId,
                assignees: dto.assignee_ids?.length
                    ? { create: dto.assignee_ids.map(uid => ({ user_id: uid })) }
                    : undefined,
            },
            include: this.taskInclude,
        });

        // Notify assignees
        if (dto.assignee_ids?.length) {
            const leader = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
            const team = await this.prisma.team.findUnique({ where: { id: teamId }, select: { name: true } });
            await this.prisma.notification.createMany({
                data: dto.assignee_ids.map(uid => ({
                    user_id: uid,
                    type: 'TASK_ASSIGNED',
                    payload: {
                        task_id: task.id,
                        task_title: task.title,
                        team_id: teamId,
                        team_name: team?.name,
                        assigned_by: leader?.name,
                        message: `${leader?.name} assigned you a task: "${task.title}"`,
                    },
                })),
            });
        }

        await this.logActivity(teamId, userId, 'TASK_CREATED', `Task "${task.title}" was created`);
        return task;
    }

    async getTeamTasks(teamId: string, userId: string, filters?: {
        status?: string; priority?: string; assignee_id?: string; search?: string;
    }) {
        await this.assertMember(teamId, userId);

        const where: any = { team_id: teamId };
        if (filters?.status) where.status = filters.status;
        if (filters?.priority) where.priority = filters.priority;
        if (filters?.assignee_id) where.assignees = { some: { user_id: filters.assignee_id } };
        if (filters?.search) where.title = { contains: filters.search, mode: 'insensitive' };

        return this.prisma.teamTask.findMany({
            where,
            include: this.taskInclude,
            orderBy: [{ status: 'asc' }, { due_date: 'asc' }, { created_at: 'desc' }],
        });
    }

    async getTask(taskId: string, userId: string) {
        const task = await this.prisma.teamTask.findUnique({
            where: { id: taskId },
            include: this.taskInclude,
        });
        if (!task) throw new NotFoundException('Task not found');
        await this.assertMember(task.team_id, userId);
        return task;
    }

    async updateTask(taskId: string, userId: string, dto: UpdateTeamTaskDto) {
        const task = await this.prisma.teamTask.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');

        const member = await this.assertMember(task.team_id, userId);
        const isLeader = member.role === 'LEADER';
        const isAssignee = await this.prisma.teamTaskAssignee.findUnique({
            where: { task_id_user_id: { task_id: taskId, user_id: userId } },
        });

        // Members can only update status if they're assigned
        if (!isLeader && !isAssignee) throw new ForbiddenException('Not authorized to update this task');
        if (!isLeader && dto.title) throw new ForbiddenException('Only leaders can edit task details');

        const history: any[] = [];

        if (dto.status && dto.status !== task.status) {
            history.push({ task_id: taskId, user_id: userId, field: 'status', old_value: task.status, new_value: dto.status });
        }
        if (dto.priority && dto.priority !== task.priority) {
            history.push({ task_id: taskId, user_id: userId, field: 'priority', old_value: task.priority, new_value: dto.priority });
        }

        const updated = await this.prisma.teamTask.update({
            where: { id: taskId },
            data: {
                title: isLeader ? dto.title : undefined,
                description: isLeader ? dto.description : undefined,
                priority: isLeader ? dto.priority : undefined,
                status: dto.status,
                start_date: dto.start_date ? new Date(dto.start_date) : undefined,
                due_date: isLeader && dto.due_date ? new Date(dto.due_date) : undefined,
                estimate_hours: isLeader ? dto.estimate_hours : undefined,
                assignees: isLeader && dto.assignee_ids !== undefined ? {
                    deleteMany: {},
                    create: dto.assignee_ids.map(uid => ({ user_id: uid })),
                } : undefined,
            },
            include: this.taskInclude,
        });

        if (history.length) {
            await this.prisma.teamTaskHistory.createMany({ data: history });
        }

        await this.logActivity(task.team_id, userId, 'TASK_UPDATED', `Task "${task.title}" was updated`);
        return updated;
    }

    async deleteTask(taskId: string, userId: string) {
        const task = await this.prisma.teamTask.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        await this.assertLeader(task.team_id, userId);
        await this.prisma.teamTask.delete({ where: { id: taskId } });
        await this.logActivity(task.team_id, userId, 'TASK_DELETED', `Task "${task.title}" was deleted`);
        return { message: 'Task deleted' };
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    async addComment(taskId: string, userId: string, dto: AddTaskCommentDto) {
        const task = await this.prisma.teamTask.findUnique({ where: { id: taskId } });
        if (!task) throw new NotFoundException('Task not found');
        await this.assertMember(task.team_id, userId);

        return this.prisma.teamTaskComment.create({
            data: { task_id: taskId, user_id: userId, body: dto.body },
            include: { user: { select: { id: true, name: true, avatar_url: true } } },
        });
    }

    async deleteComment(commentId: string, userId: string) {
        const comment = await this.prisma.teamTaskComment.findUnique({ where: { id: commentId } });
        if (!comment) throw new NotFoundException('Comment not found');
        if (comment.user_id !== userId) throw new ForbiddenException('Cannot delete another user\'s comment');
        return this.prisma.teamTaskComment.delete({ where: { id: commentId } });
    }

    // ── Milestones ────────────────────────────────────────────────────────────

    async createMilestone(teamId: string, userId: string, dto: CreateMilestoneDto) {
        await this.assertLeader(teamId, userId);

        const milestone = await this.prisma.milestone.create({
            data: {
                team_id: teamId,
                name: dto.name,
                description: dto.description,
                start_date: dto.start_date ? new Date(dto.start_date) : undefined,
                target_date: dto.target_date ? new Date(dto.target_date) : undefined,
                created_by: userId,
                tasks: dto.task_ids?.length
                    ? { create: dto.task_ids.map(tid => ({ task_id: tid })) }
                    : undefined,
            },
            include: {
                tasks: { include: { task: { select: { id: true, title: true, status: true } } } },
                creator: { select: { id: true, name: true } },
            },
        });

        await this.logActivity(teamId, userId, 'MILESTONE_CREATED', `Milestone "${milestone.name}" was created`);
        return milestone;
    }

    async getTeamMilestones(teamId: string, userId: string) {
        await this.assertMember(teamId, userId);
        return this.prisma.milestone.findMany({
            where: { team_id: teamId },
            include: {
                tasks: { include: { task: { select: { id: true, title: true, status: true, due_date: true } } } },
                creator: { select: { id: true, name: true } },
            },
            orderBy: { target_date: 'asc' },
        });
    }

    async updateMilestone(milestoneId: string, userId: string, dto: UpdateMilestoneDto) {
        const ms = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
        if (!ms) throw new NotFoundException('Milestone not found');
        await this.assertLeader(ms.team_id, userId);

        const updated = await this.prisma.milestone.update({
            where: { id: milestoneId },
            data: {
                name: dto.name,
                description: dto.description,
                status: dto.status,
                start_date: dto.start_date ? new Date(dto.start_date) : undefined,
                target_date: dto.target_date ? new Date(dto.target_date) : undefined,
                tasks: dto.task_ids !== undefined ? {
                    deleteMany: {},
                    create: dto.task_ids.map(tid => ({ task_id: tid })),
                } : undefined,
            },
            include: {
                tasks: { include: { task: { select: { id: true, title: true, status: true } } } },
                creator: { select: { id: true, name: true } },
            },
        });

        await this.logActivity(ms.team_id, userId, 'MILESTONE_UPDATED', `Milestone "${ms.name}" updated`);
        return updated;
    }

    async deleteMilestone(milestoneId: string, userId: string) {
        const ms = await this.prisma.milestone.findUnique({ where: { id: milestoneId } });
        if (!ms) throw new NotFoundException('Milestone not found');
        await this.assertLeader(ms.team_id, userId);
        await this.prisma.milestone.delete({ where: { id: milestoneId } });
        return { message: 'Milestone deleted' };
    }

    // ── Progress Updates ──────────────────────────────────────────────────────

    async createProgressUpdate(teamId: string, userId: string, dto: CreateProgressUpdateDto) {
        await this.assertMember(teamId, userId);
        const update = await this.prisma.progressUpdate.create({
            data: { team_id: teamId, user_id: userId, ...dto },
            include: { user: { select: { id: true, name: true, avatar_url: true } } },
        });
        await this.logActivity(teamId, userId, 'PROGRESS_UPDATED', `Progress update submitted`);
        return update;
    }

    async getProgressUpdates(teamId: string, userId: string) {
        await this.assertMember(teamId, userId);
        return this.prisma.progressUpdate.findMany({
            where: { team_id: teamId },
            include: { user: { select: { id: true, name: true, avatar_url: true } } },
            orderBy: { created_at: 'desc' },
            take: 100,
        });
    }

    // ── Dashboard Stats ───────────────────────────────────────────────────────

    async getTeamStats(teamId: string, userId: string) {
        await this.assertMember(teamId, userId);
        const now = new Date();

        const [total, completed, inProgress, overdue, milestones, upcoming] = await Promise.all([
            this.prisma.teamTask.count({ where: { team_id: teamId } }),
            this.prisma.teamTask.count({ where: { team_id: teamId, status: 'COMPLETED' } }),
            this.prisma.teamTask.count({ where: { team_id: teamId, status: 'IN_PROGRESS' } }),
            this.prisma.teamTask.count({ where: { team_id: teamId, due_date: { lt: now }, status: { not: 'COMPLETED' } } }),
            this.prisma.milestone.count({ where: { team_id: teamId } }),
            this.prisma.teamTask.findMany({
                where: {
                    team_id: teamId,
                    due_date: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
                    status: { not: 'COMPLETED' },
                },
                include: { assignees: { include: { user: { select: { name: true } } } } },
                orderBy: { due_date: 'asc' },
                take: 5,
            }),
        ]);

        return {
            total, completed, inProgress, overdue, milestones,
            pending: total - completed,
            completion_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
            upcoming_deadlines: upcoming,
        };
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async logActivity(teamId: string, userId: string, action: string, description: string) {
        await this.prisma.teamActivity.create({
            data: { team_id: teamId, user_id: userId, action, description },
        });
    }
}
