import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto, InviteMemberDto, UpdateMemberRoleDto } from '@esmp/shared';
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class TeamsService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) {}

    private generateInviteCode(): string {
        return randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F9B2C1"
    }

    // ── Create team ──────────────────────────────────────────────────────────
    async create(userId: string, dto: CreateTeamDto) {
        const invite_code = this.generateInviteCode();

        const team = await this.prisma.team.create({
            data: {
                name: dto.name,
                description: dto.description,
                project_name: dto.project_name,
                purpose: dto.purpose,
                visibility: dto.visibility || 'PRIVATE',
                invite_code,
                created_by: userId,
                members: {
                    create: { user_id: userId, role: 'LEADER' },
                },
            },
            include: { members: { include: { user: true } } },
        });

        await this.logActivity(team.id, userId, 'TEAM_CREATED', `Team "${team.name}" was created`);
        return team;
    }

    // ── Get all teams for user ───────────────────────────────────────────────
    async findMyTeams(userId: string) {
        return this.prisma.team.findMany({
            where: {
                members: { some: { user_id: userId, status: 'ACTIVE' } },
                status: 'ACTIVE',
            },
            include: {
                members: {
                    where: { status: 'ACTIVE' },
                    include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } },
                },
                _count: { select: { members: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    // ── Get single team (members only) ───────────────────────────────────────
    async findOne(teamId: string, userId: string) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: {
                    where: { status: 'ACTIVE' },
                    include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } },
                    orderBy: { joined_at: 'asc' },
                },
                activity: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { created_at: 'desc' },
                    take: 20,
                },
                invites: { where: { status: 'PENDING' }, orderBy: { created_at: 'desc' } },
            },
        });

        if (!team) throw new NotFoundException('Team not found');
        this.assertMember(team, userId);
        return team;
    }

    // ── Update team (leader only) ────────────────────────────────────────────
    async update(teamId: string, userId: string, dto: UpdateTeamDto) {
        await this.assertLeader(teamId, userId);
        const team = await this.prisma.team.update({
            where: { id: teamId },
            data: dto,
        });
        await this.logActivity(teamId, userId, 'TEAM_UPDATED', `Team details updated`);
        return team;
    }

    // ── Archive team (leader only) ───────────────────────────────────────────
    async archive(teamId: string, userId: string) {
        await this.assertLeader(teamId, userId);
        const team = await this.prisma.team.update({
            where: { id: teamId },
            data: { status: 'ARCHIVED' },
        });
        await this.logActivity(teamId, userId, 'TEAM_ARCHIVED', `Team was archived`);
        return team;
    }

    // ── Delete team (leader only) ────────────────────────────────────────────
    async remove(teamId: string, userId: string) {
        await this.assertLeader(teamId, userId);
        return this.prisma.team.delete({ where: { id: teamId } });
    }

    // ── Invite member by email ───────────────────────────────────────────────
    async inviteMember(teamId: string, leaderId: string, dto: InviteMemberDto) {
        await this.assertLeader(teamId, leaderId);

        if (!dto.email) throw new BadRequestException('Email is required');

        // 1. Verify the email belongs to a registered ESMP user
        const invitee = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!invitee) {
            throw new BadRequestException('No ESMP account found for this email. The user must register first.');
        }

        // 2. Check not already a member
        const alreadyMember = await this.prisma.teamMember.findUnique({
            where: { team_id_user_id: { team_id: teamId, user_id: invitee.id } },
        });
        if (alreadyMember && alreadyMember.status === 'ACTIVE') {
            throw new ConflictException('This user is already a member of the team.');
        }

        // 3. Check no pending invite already
        const existingInvite = await this.prisma.teamInvite.findFirst({
            where: { team_id: teamId, email: dto.email, status: 'PENDING' },
        });
        if (existingInvite) {
            throw new ConflictException('An invite has already been sent to this user.');
        }

        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        const leader = await this.prisma.user.findUnique({ where: { id: leaderId } });

        const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const invite = await this.prisma.teamInvite.create({
            data: { team_id: teamId, email: dto.email, expires_at },
        });

        // 4. Create in-app notification for the invitee
        await this.prisma.notification.create({
            data: {
                user_id: invitee.id,
                type: 'TEAM_INVITE',
                payload: {
                    invite_id: invite.id,
                    team_id: teamId,
                    team_name: team!.name,
                    invited_by: leader!.name,
                    invited_by_email: leader!.email,
                    message: `${leader!.name} invited you to join the team "${team!.name}"`,
                },
            },
        });

        // 5. Send Gmail notification
        await this.mailService.sendTeamInviteEmail(
            dto.email,
            invitee.name,
            leader!.name,
            team!.name,
        );

        await this.logActivity(teamId, leaderId, 'MEMBER_INVITED', `Invited ${dto.email}`);
        return { message: `Invite sent to ${dto.email}` };
    }

    // ── Accept invite (by notification) ─────────────────────────────────────
    async acceptInvite(inviteId: string, userId: string) {
        const invite = await this.prisma.teamInvite.findUnique({ where: { id: inviteId } });
        if (!invite) throw new NotFoundException('Invite not found');
        if (invite.status !== 'PENDING') throw new BadRequestException('This invite has already been used or expired');
        if (new Date() > invite.expires_at) {
            await this.prisma.teamInvite.update({ where: { id: inviteId }, data: { status: 'EXPIRED' } });
            throw new BadRequestException('This invite has expired');
        }

        // Verify the user's email matches the invite
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.email !== invite.email) {
            throw new ForbiddenException('This invite was not sent to your account');
        }

        const team = await this.prisma.team.findUnique({ where: { id: invite.team_id } });
        if (!team || team.status !== 'ACTIVE') throw new NotFoundException('Team not found or archived');

        // Add to team (or re-activate)
        const existing = await this.prisma.teamMember.findUnique({
            where: { team_id_user_id: { team_id: invite.team_id, user_id: userId } },
        });
        if (existing) {
            if (existing.status === 'ACTIVE') throw new ConflictException('You are already a member');
            await this.prisma.teamMember.update({
                where: { team_id_user_id: { team_id: invite.team_id, user_id: userId } },
                data: { status: 'ACTIVE' },
            });
        } else {
            await this.prisma.teamMember.create({
                data: { team_id: invite.team_id, user_id: userId, role: 'MEMBER' },
            });
        }

        // Mark invite accepted
        await this.prisma.teamInvite.update({ where: { id: inviteId }, data: { status: 'ACCEPTED' } });

        // Mark the notification as read
        await this.prisma.notification.updateMany({
            where: {
                user_id: userId,
                type: 'TEAM_INVITE',
                payload: { path: ['invite_id'], equals: inviteId },
            },
            data: { read: true },
        });

        await this.logActivity(invite.team_id, userId, 'MEMBER_JOINED', `${user.name} accepted the team invite`);
        return { message: 'You have joined the team!', team_id: invite.team_id };
    }

    // ── Decline invite ───────────────────────────────────────────────────────
    async declineInvite(inviteId: string, userId: string) {
        const invite = await this.prisma.teamInvite.findUnique({ where: { id: inviteId } });
        if (!invite) throw new NotFoundException('Invite not found');

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.email !== invite.email) throw new ForbiddenException('This invite was not sent to your account');

        await this.prisma.teamInvite.update({ where: { id: inviteId }, data: { status: 'EXPIRED' } });

        // Mark notification read
        await this.prisma.notification.updateMany({
            where: {
                user_id: userId,
                type: 'TEAM_INVITE',
                payload: { path: ['invite_id'], equals: inviteId },
            },
            data: { read: true },
        });

        return { message: 'Invite declined' };
    }

    // ── Join via invite code ─────────────────────────────────────────────────
    async joinByCode(userId: string, invite_code: string) {
        const team = await this.prisma.team.findUnique({ where: { invite_code } });
        if (!team || team.status !== 'ACTIVE') throw new NotFoundException('Invalid or expired invite code');

        const existing = await this.prisma.teamMember.findUnique({
            where: { team_id_user_id: { team_id: team.id, user_id: userId } },
        });
        if (existing) {
            if (existing.status === 'ACTIVE') throw new ConflictException('You are already a member of this team');
            // Re-activate if removed
            return this.prisma.teamMember.update({
                where: { team_id_user_id: { team_id: team.id, user_id: userId } },
                data: { status: 'ACTIVE' },
            });
        }

        const member = await this.prisma.teamMember.create({
            data: { team_id: team.id, user_id: userId, role: 'MEMBER' },
        });
        await this.logActivity(team.id, userId, 'MEMBER_JOINED', `A new member joined the team`);
        return { team, member };
    }

    // ── Remove member (leader only) ──────────────────────────────────────────
    async removeMember(teamId: string, leaderId: string, memberId: string) {
        await this.assertLeader(teamId, leaderId);
        if (leaderId === memberId) throw new BadRequestException('Team leader cannot remove themselves');

        await this.prisma.teamMember.update({
            where: { team_id_user_id: { team_id: teamId, user_id: memberId } },
            data: { status: 'REMOVED' },
        });
        await this.logActivity(teamId, leaderId, 'MEMBER_REMOVED', `A member was removed from the team`);
        return { message: 'Member removed' };
    }

    // ── Update member role (leader only) ─────────────────────────────────────
    async updateMemberRole(teamId: string, leaderId: string, memberId: string, dto: UpdateMemberRoleDto) {
        await this.assertLeader(teamId, leaderId);
        const member = await this.prisma.teamMember.update({
            where: { team_id_user_id: { team_id: teamId, user_id: memberId } },
            data: { role: dto.role },
        });
        await this.logActivity(teamId, leaderId, 'ROLE_UPDATED', `Member role updated to ${dto.role}`);
        return member;
    }

    // ── Regenerate invite code (leader only) ─────────────────────────────────
    async regenerateInviteCode(teamId: string, userId: string) {
        await this.assertLeader(teamId, userId);
        const invite_code = this.generateInviteCode();
        const team = await this.prisma.team.update({ where: { id: teamId }, data: { invite_code } });
        await this.logActivity(teamId, userId, 'INVITE_CODE_REGENERATED', `Invite code was regenerated`);
        return { invite_code: team.invite_code };
    }

    // ── MANAGER ADD-ON: Get all teams visible to manager ─────────────────────
    async findAllTeamsForManager(managerId: string) {
        // Verify manager/admin role
        const roles = await this.prisma.userRole.findMany({ where: { user_id: managerId }, include: { role: true } });
        const roleNames = roles.map(r => r.role.name.toUpperCase());
        if (!roleNames.some(r => ['MANAGER', 'ADMIN'].includes(r))) {
            throw new ForbiddenException('Manager access required');
        }

        // Get all active teams (manager can see all, not just ones they're in)
        const teams = await this.prisma.team.findMany({
            where: { status: 'ACTIVE' },
            include: {
                members: {
                    where: { status: 'ACTIVE' },
                    include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } },
                },
                tasks: {
                    select: { id: true, status: true, priority: true, title: true },
                    take: 10,
                    orderBy: { updated_at: 'desc' },
                },
                activity: {
                    include: { user: { select: { id: true, name: true } } },
                    orderBy: { created_at: 'desc' },
                    take: 5,
                },
                _count: { select: { members: true, tasks: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        // Attach client projects assigned to each team
        const clientProjects = await this.prisma.clientProject.findMany({
            where: { team_id: { not: null } },
            include: {
                client: { select: { id: true, name: true, email: true, organization: true } },
                deliverables: { select: { id: true, status: true } },
                milestones: { select: { id: true, status: true } },
            },
        });

        const projectsByTeam = new Map<string, any[]>();
        clientProjects.forEach(p => {
            if (p.team_id) {
                if (!projectsByTeam.has(p.team_id)) projectsByTeam.set(p.team_id, []);
                projectsByTeam.get(p.team_id)!.push(p);
            }
        });

        return teams.map(t => ({
            ...t,
            clientProjects: projectsByTeam.get(t.id) || [],
            taskStats: {
                total: t.tasks.length,
                todo: t.tasks.filter((tk: any) => tk.status === 'TODO').length,
                inProgress: t.tasks.filter((tk: any) => tk.status === 'IN_PROGRESS').length,
                done: t.tasks.filter((tk: any) => tk.status === 'COMPLETED' || tk.status === 'DONE').length,
            },
        }));
    }

    // ── MANAGER ADD-ON: Assign client project to team ─────────────────────────
    async assignClientProjectToTeam(managerId: string, projectId: string, teamId: string | null) {
        const roles = await this.prisma.userRole.findMany({ where: { user_id: managerId }, include: { role: true } });
        const roleNames = roles.map(r => r.role.name.toUpperCase());
        if (!roleNames.some(r => ['MANAGER', 'ADMIN'].includes(r))) {
            throw new ForbiddenException('Manager access required');
        }

        const project = await this.prisma.clientProject.findUnique({ where: { id: projectId } });
        if (!project) throw new NotFoundException('Client project not found');
        if (project.manager_id !== managerId && !roleNames.includes('ADMIN')) {
            throw new ForbiddenException('You can only assign your own client projects');
        }

        if (teamId) {
            const team = await this.prisma.team.findUnique({ where: { id: teamId } });
            if (!team) throw new NotFoundException('Team not found');
        }

        const updated = await this.prisma.clientProject.update({
            where: { id: projectId },
            data: { team_id: teamId },
        });

        // Notify client about team assignment
        if (teamId) {
            const team = await this.prisma.team.findUnique({ where: { id: teamId } });
            await this.prisma.notification.create({
                data: {
                    user_id: project.client_id,
                    type: 'PROJECT_TEAM_ASSIGNED',
                    payload: {
                        project_id: projectId,
                        team_id: teamId,
                        team_name: team?.name,
                        message: `Your project "${project.project_name}" has been assigned to team "${team?.name}"`,
                    },
                },
            });
        }

        return updated;
    }

    // ── MANAGER ADD-ON: Get team-client mapping overview ─────────────────────
    async getTeamClientMapping(managerId: string) {
        const roles = await this.prisma.userRole.findMany({ where: { user_id: managerId }, include: { role: true } });
        const roleNames = roles.map(r => r.role.name.toUpperCase());
        if (!roleNames.some(r => ['MANAGER', 'ADMIN'].includes(r))) {
            throw new ForbiddenException('Manager access required');
        }

        const [teams, clientProjects, unassignedProjects] = await Promise.all([
            this.prisma.team.findMany({
                where: { status: 'ACTIVE' },
                include: {
                    members: { where: { status: 'ACTIVE' }, select: { user_id: true, role: true } },
                    _count: { select: { tasks: true, members: true } },
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.clientProject.findMany({
                where: { team_id: { not: null }, manager_id: roleNames.includes('ADMIN') ? undefined : managerId },
                include: {
                    client: { select: { id: true, name: true, email: true, organization: true } },
                    deliverables: { select: { id: true, status: true } },
                    milestones: { select: { id: true, status: true } },
                },
            }),
            this.prisma.clientProject.findMany({
                where: { team_id: null, manager_id: roleNames.includes('ADMIN') ? undefined : managerId, is_active: true },
                include: {
                    client: { select: { id: true, name: true, email: true, organization: true } },
                },
            }),
        ]);

        const projectsByTeam = new Map<string, any[]>();
        clientProjects.forEach(p => {
            if (p.team_id) {
                if (!projectsByTeam.has(p.team_id)) projectsByTeam.set(p.team_id, []);
                projectsByTeam.get(p.team_id)!.push(p);
            }
        });

        return {
            teams: teams.map(t => ({
                ...t,
                assignedProjects: projectsByTeam.get(t.id) || [],
            })),
            unassignedProjects,
            stats: {
                totalTeams: teams.length,
                totalAssigned: clientProjects.length,
                totalUnassigned: unassignedProjects.length,
            },
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private assertMember(team: any, userId: string) {
        const isMember = team.members?.some((m: any) => m.user_id === userId && m.status === 'ACTIVE');
        if (!isMember) throw new ForbiddenException('You are not a member of this team');
    }

    private async assertLeader(teamId: string, userId: string) {
        const member = await this.prisma.teamMember.findUnique({
            where: { team_id_user_id: { team_id: teamId, user_id: userId } },
        });
        if (!member || member.role !== 'LEADER' || member.status !== 'ACTIVE') {
            throw new ForbiddenException('Only the team leader can perform this action');
        }
    }

    private async logActivity(teamId: string, userId: string, action: string, description: string) {
        await this.prisma.teamActivity.create({
            data: { team_id: teamId, user_id: userId, action, description },
        });
    }
}
