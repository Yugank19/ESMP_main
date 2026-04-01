import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateAnnouncementDto, UpdateAnnouncementDto,
    CreateMeetingNoteDto, UpdateMeetingNoteDto,
} from '@esmp/shared';

@Injectable()
export class TeamCollabService {
    constructor(private prisma: PrismaService) {}

    private async assertMember(teamId: string, userId: string) {
        const m = await this.prisma.teamMember.findFirst({
            where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
        });
        if (!m) throw new ForbiddenException('Not a team member');
        return m;
    }

    private async assertLeader(teamId: string, userId: string) {
        const m = await this.assertMember(teamId, userId);
        if (m.role !== 'LEADER') throw new ForbiddenException('Leader only');
        return m;
    }

    // ── Announcements ─────────────────────────────────────────────────────────

    async createAnnouncement(teamId: string, userId: string, dto: CreateAnnouncementDto) {
        await this.assertLeader(teamId, userId);
        const ann = await this.prisma.teamAnnouncement.create({
            data: { team_id: teamId, author_id: userId, ...dto },
            include: { author: { select: { id: true, name: true } } },
        });
        await this.logActivity(teamId, userId, 'ANNOUNCEMENT_POSTED', `Posted announcement: ${dto.title}`);
        return ann;
    }

    async getAnnouncements(teamId: string, userId: string) {
        await this.assertMember(teamId, userId);
        return this.prisma.teamAnnouncement.findMany({
            where: { team_id: teamId },
            include: { author: { select: { id: true, name: true } } },
            orderBy: [{ is_pinned: 'desc' }, { created_at: 'desc' }],
        });
    }

    async updateAnnouncement(annId: string, userId: string, teamId: string, dto: UpdateAnnouncementDto) {
        await this.assertLeader(teamId, userId);
        const ann = await this.prisma.teamAnnouncement.findUnique({ where: { id: annId } });
        if (!ann || ann.team_id !== teamId) throw new NotFoundException('Announcement not found');
        return this.prisma.teamAnnouncement.update({
            where: { id: annId },
            data: dto,
            include: { author: { select: { id: true, name: true } } },
        });
    }

    async deleteAnnouncement(annId: string, userId: string, teamId: string) {
        await this.assertLeader(teamId, userId);
        return this.prisma.teamAnnouncement.delete({ where: { id: annId } });
    }

    // ── Meeting Notes ─────────────────────────────────────────────────────────

    async createMeetingNote(teamId: string, userId: string, dto: CreateMeetingNoteDto) {
        await this.assertMember(teamId, userId);
        const note = await this.prisma.meetingNote.create({
            data: {
                team_id: teamId,
                created_by: userId,
                title: dto.title,
                meeting_date: new Date(dto.meeting_date),
                agenda: dto.agenda,
                attendees: dto.attendees,
                discussion: dto.discussion,
                action_items: dto.action_items,
                follow_up: dto.follow_up,
            },
            include: { creator: { select: { id: true, name: true } } },
        });
        await this.logActivity(teamId, userId, 'MEETING_NOTE_CREATED', `Created meeting note: ${dto.title}`);
        return note;
    }

    async getMeetingNotes(teamId: string, userId: string) {
        await this.assertMember(teamId, userId);
        return this.prisma.meetingNote.findMany({
            where: { team_id: teamId },
            include: { creator: { select: { id: true, name: true } } },
            orderBy: { meeting_date: 'desc' },
        });
    }

    async getMeetingNote(noteId: string, userId: string, teamId: string) {
        await this.assertMember(teamId, userId);
        const note = await this.prisma.meetingNote.findUnique({
            where: { id: noteId },
            include: { creator: { select: { id: true, name: true } } },
        });
        if (!note || note.team_id !== teamId) throw new NotFoundException('Note not found');
        return note;
    }

    async updateMeetingNote(noteId: string, userId: string, teamId: string, dto: UpdateMeetingNoteDto) {
        await this.assertMember(teamId, userId);
        const note = await this.prisma.meetingNote.findUnique({ where: { id: noteId } });
        if (!note || note.team_id !== teamId) throw new NotFoundException('Note not found');
        const member = await this.prisma.teamMember.findFirst({
            where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
        });
        if (note.created_by !== userId && member?.role !== 'LEADER') {
            throw new ForbiddenException('Cannot edit this note');
        }
        return this.prisma.meetingNote.update({
            where: { id: noteId },
            data: {
                ...dto,
                ...(dto.meeting_date ? { meeting_date: new Date(dto.meeting_date) } : {}),
            },
            include: { creator: { select: { id: true, name: true } } },
        });
    }

    async deleteMeetingNote(noteId: string, userId: string, teamId: string) {
        const note = await this.prisma.meetingNote.findUnique({ where: { id: noteId } });
        if (!note || note.team_id !== teamId) throw new NotFoundException('Note not found');
        const member = await this.prisma.teamMember.findFirst({
            where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
        });
        if (note.created_by !== userId && member?.role !== 'LEADER') {
            throw new ForbiddenException('Cannot delete this note');
        }
        return this.prisma.meetingNote.delete({ where: { id: noteId } });
    }

    // ── Activity Feed ─────────────────────────────────────────────────────────

    async getActivityFeed(teamId: string, userId: string) {
        await this.assertMember(teamId, userId);
        return this.prisma.teamActivity.findMany({
            where: { team_id: teamId },
            include: { user: { select: { id: true, name: true, avatar_url: true } } },
            orderBy: { created_at: 'desc' },
            take: 100,
        });
    }

    private async logActivity(teamId: string, userId: string, action: string, description: string) {
        await this.prisma.teamActivity.create({
            data: { team_id: teamId, user_id: userId, action, description },
        }).catch(() => {});
    }
}
