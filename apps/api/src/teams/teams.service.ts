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
