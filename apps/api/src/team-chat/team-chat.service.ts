import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendChatMessageDto, EditChatMessageDto } from '@esmp/shared';

@Injectable()
export class TeamChatService {
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

    async getMessages(teamId: string, userId: string, cursor?: string, limit = 50) {
        await this.assertMember(teamId, userId);
        const messages = await this.prisma.teamChatMessage.findMany({
            where: { team_id: teamId, deleted_at: null },
            include: {
                sender: { select: { id: true, name: true, avatar_url: true } },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        return messages.reverse();
    }

    async sendMessage(teamId: string, userId: string, dto: SendChatMessageDto) {
        await this.assertMember(teamId, userId);
        const msg = await this.prisma.teamChatMessage.create({
            data: {
                team_id: teamId,
                sender_id: userId,
                body: dto.body,
                type: dto.type || 'TEXT',
                file_url: dto.file_url,
                file_name: dto.file_name,
                file_size: dto.file_size,
            },
            include: {
                sender: { select: { id: true, name: true, avatar_url: true } },
            },
        });
        return msg;
    }

    async editMessage(messageId: string, userId: string, dto: EditChatMessageDto) {
        const msg = await this.prisma.teamChatMessage.findUnique({ where: { id: messageId } });
        if (!msg) throw new NotFoundException('Message not found');
        if (msg.sender_id !== userId) throw new ForbiddenException('Cannot edit others messages');
        return this.prisma.teamChatMessage.update({
            where: { id: messageId },
            data: { body: dto.body, is_edited: true },
            include: { sender: { select: { id: true, name: true, avatar_url: true } } },
        });
    }

    async deleteMessage(messageId: string, userId: string, teamId: string) {
        const msg = await this.prisma.teamChatMessage.findUnique({ where: { id: messageId } });
        if (!msg) throw new NotFoundException('Message not found');
        const member = await this.prisma.teamMember.findFirst({
            where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
        });
        if (msg.sender_id !== userId && member?.role !== 'LEADER') {
            throw new ForbiddenException('Cannot delete this message');
        }
        return this.prisma.teamChatMessage.update({
            where: { id: messageId },
            data: { deleted_at: new Date() },
        });
    }

    async pinMessage(messageId: string, userId: string, teamId: string) {
        await this.assertLeader(teamId, userId);
        return this.prisma.teamChatMessage.update({
            where: { id: messageId },
            data: { is_pinned: true },
        });
    }

    async unpinMessage(messageId: string, userId: string, teamId: string) {
        await this.assertLeader(teamId, userId);
        return this.prisma.teamChatMessage.update({
            where: { id: messageId },
            data: { is_pinned: false },
        });
    }

    async getPinnedMessages(teamId: string, userId: string) {
        await this.assertMember(teamId, userId);
        return this.prisma.teamChatMessage.findMany({
            where: { team_id: teamId, is_pinned: true, deleted_at: null },
            include: { sender: { select: { id: true, name: true, avatar_url: true } } },
            orderBy: { created_at: 'desc' },
        });
    }

    async markRead(teamId: string, userId: string, messageId: string) {
        await this.assertMember(teamId, userId);
        return this.prisma.teamChatRead.upsert({
            where: { message_id_user_id: { message_id: messageId, user_id: userId } },
            create: { message_id: messageId, user_id: userId },
            update: { read_at: new Date() },
        });
    }

    async searchMessages(teamId: string, userId: string, query: string) {
        await this.assertMember(teamId, userId);
        return this.prisma.teamChatMessage.findMany({
            where: {
                team_id: teamId,
                deleted_at: null,
                body: { contains: query, mode: 'insensitive' },
            },
            include: { sender: { select: { id: true, name: true, avatar_url: true } } },
            orderBy: { created_at: 'desc' },
            take: 30,
        });
    }
}
