import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // ── User search ──────────────────────────────────────────────────────────────
  async searchUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, avatar_url: true, organization: true, bio: true, created_at: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserProfile(targetId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, email: true, name: true, avatar_url: true, organization: true, bio: true, phone: true, created_at: true,
        roles: { include: { role: { select: { name: true } } } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // ── Chat requests ────────────────────────────────────────────────────────────
  async sendChatRequest(senderId: string, receiverEmail: string) {
    const receiver = await this.prisma.user.findUnique({ where: { email: receiverEmail } });
    if (!receiver) throw new NotFoundException('User not found with that email');
    if (receiver.id === senderId) throw new BadRequestException('Cannot send request to yourself');

    const existingRoom = await this.prisma.room.findFirst({
      where: { type: 'DIRECT', AND: [{ members: { some: { user_id: senderId } } }, { members: { some: { user_id: receiver.id } } }] },
    });
    if (existingRoom) throw new BadRequestException('You already have a conversation with this person');

    const existingRequest = await this.prisma.chatRequest.findFirst({
      where: { OR: [{ sender_id: senderId, receiver_id: receiver.id }, { sender_id: receiver.id, receiver_id: senderId }] },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') throw new BadRequestException('A chat request is already pending with this person');
      if (existingRequest.status === 'ACCEPTED') throw new BadRequestException('You already have a conversation with this person');
      return this.prisma.chatRequest.update({ where: { id: existingRequest.id }, data: { status: 'PENDING', sender_id: senderId, receiver_id: receiver.id } });
    }

    return this.prisma.chatRequest.create({ data: { sender_id: senderId, receiver_id: receiver.id, status: 'PENDING' } });
  }

  async getPendingRequests(userId: string) {
    return this.prisma.chatRequest.findMany({
      where: { receiver_id: userId, status: 'PENDING' },
      include: { sender: { select: { id: true, name: true, email: true, avatar_url: true } } },
    });
  }

  async respondToRequest(requestId: string, status: 'ACCEPTED' | 'REJECTED', userId: string) {
    const request = await this.prisma.chatRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiver_id !== userId) throw new NotFoundException('Request not found');

    const updatedRequest = await this.prisma.chatRequest.update({ where: { id: requestId }, data: { status } });

    if (status === 'ACCEPTED') {
      const existingRoom = await this.prisma.room.findFirst({
        where: { type: 'DIRECT', AND: [{ members: { some: { user_id: request.sender_id } } }, { members: { some: { user_id: request.receiver_id } } }] },
        include: { members: { include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } } }, messages: { take: 1, orderBy: { created_at: 'desc' } } },
      });
      if (existingRoom) return { request: updatedRequest, room: existingRoom };

      const room = await this.prisma.room.create({
        data: { type: 'DIRECT', members: { create: [{ user_id: request.sender_id, role: 'ADMIN' }, { user_id: request.receiver_id, role: 'ADMIN' }] } },
        include: { members: { include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } } }, messages: { take: 1, orderBy: { created_at: 'desc' } } },
      });
      return { request: updatedRequest, room };
    }
    return { request: updatedRequest };
  }

  // ── Rooms ────────────────────────────────────────────────────────────────────
  async getUserRooms(userId: string) {
    const rooms = await this.prisma.room.findMany({
      where: { members: { some: { user_id: userId } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } } },
        messages: { take: 1, orderBy: { created_at: 'desc' }, include: { sender: { select: { name: true } } } },
      },
      orderBy: { updated_at: 'desc' },
    });

    const seen = new Set<string>();
    return rooms.filter(room => {
      if (room.type !== 'DIRECT') return true;
      const key = room.members.map((m: any) => m.user_id).sort().join('_');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async createGroup(ownerId: string, name: string, participantEmails: string[]) {
    if (!name?.trim()) throw new BadRequestException('Group name is required');
    if (!participantEmails?.length) throw new BadRequestException('Add at least one member');

    const participants = await this.prisma.user.findMany({ where: { email: { in: participantEmails } }, select: { id: true, email: true } });
    const memberIds = new Set<string>([ownerId]);
    participants.forEach(p => memberIds.add(p.id));

    return this.prisma.room.create({
      data: {
        name: name.trim(), type: 'GROUP',
        members: { create: Array.from(memberIds).map(uid => ({ user_id: uid, role: uid === ownerId ? 'ADMIN' : 'MEMBER' })) },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, avatar_url: true } } } },
        messages: { take: 1, orderBy: { created_at: 'desc' } },
      },
    });
  }

  async getRoomMessages(roomId: string, userId: string) {
    const membership = await this.prisma.roomMember.findUnique({ where: { room_id_user_id: { room_id: roomId, user_id: userId } } });
    if (!membership) throw new BadRequestException('Not a member of this room');

    return this.prisma.message.findMany({
      where: { room_id: roomId },
      include: { sender: { select: { id: true, name: true, avatar_url: true } } },
      orderBy: { created_at: 'asc' },
    });
  }

  // ── Message operations ───────────────────────────────────────────────────────
  async deleteMessage(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.sender_id !== userId) throw new ForbiddenException('Cannot delete others messages');
    await this.prisma.message.delete({ where: { id: messageId } });
    return { deleted: true, messageId, room_id: msg.room_id };
  }

  async editMessage(messageId: string, userId: string, body: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');
    if (msg.sender_id !== userId) throw new ForbiddenException('Cannot edit others messages');
    if (!body?.trim()) throw new BadRequestException('Message body required');
    return this.prisma.message.update({
      where: { id: messageId },
      data: { body: body.trim(), attachments: { ...(msg.attachments as any || {}), edited: true } },
      include: { sender: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  // ── Group management ─────────────────────────────────────────────────────────
  async addGroupMember(roomId: string, adminId: string, email: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.type !== 'GROUP') throw new NotFoundException('Group not found');

    const admin = await this.prisma.roomMember.findUnique({ where: { room_id_user_id: { room_id: roomId, user_id: adminId } } });
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenException('Only admins can add members');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found with that email');

    const existing = await this.prisma.roomMember.findUnique({ where: { room_id_user_id: { room_id: roomId, user_id: user.id } } });
    if (existing) throw new BadRequestException('User is already in this group');

    await this.prisma.roomMember.create({ data: { room_id: roomId, user_id: user.id, role: 'MEMBER' } });
    await this.prisma.room.update({ where: { id: roomId }, data: { updated_at: new Date() } });
    return { message: `${user.name} added to group` };
  }

  async removeGroupMember(roomId: string, adminId: string, memberId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.type !== 'GROUP') throw new NotFoundException('Group not found');

    const admin = await this.prisma.roomMember.findUnique({ where: { room_id_user_id: { room_id: roomId, user_id: adminId } } });
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenException('Only admins can remove members');
    if (memberId === adminId) throw new BadRequestException('Use leave group to remove yourself');

    await this.prisma.roomMember.delete({ where: { room_id_user_id: { room_id: roomId, user_id: memberId } } });
    return { message: 'Member removed' };
  }

  async leaveGroup(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId }, include: { members: true } });
    if (!room || room.type !== 'GROUP') throw new NotFoundException('Group not found');

    const member = await this.prisma.roomMember.findUnique({ where: { room_id_user_id: { room_id: roomId, user_id: userId } } });
    if (!member) throw new NotFoundException('Not a member of this group');

    // If last member, delete the room
    if (room.members.length === 1) {
      await this.prisma.room.delete({ where: { id: roomId } });
      return { message: 'Group deleted (last member left)', deleted: true };
    }

    // If admin leaving, promote next member
    if (member.role === 'ADMIN') {
      const next = room.members.find((m: any) => m.user_id !== userId);
      if (next) await this.prisma.roomMember.update({ where: { room_id_user_id: { room_id: roomId, user_id: next.user_id } }, data: { role: 'ADMIN' } });
    }

    await this.prisma.roomMember.delete({ where: { room_id_user_id: { room_id: roomId, user_id: userId } } });
    return { message: 'Left group', deleted: false };
  }

  async renameGroup(roomId: string, adminId: string, name: string) {
    const admin = await this.prisma.roomMember.findUnique({ where: { room_id_user_id: { room_id: roomId, user_id: adminId } } });
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenException('Only admins can rename the group');
    if (!name?.trim()) throw new BadRequestException('Name required');
    return this.prisma.room.update({ where: { id: roomId }, data: { name: name.trim() } });
  }

  async deleteRoom(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    const member = await this.prisma.roomMember.findUnique({ where: { room_id_user_id: { room_id: roomId, user_id: userId } } });
    if (!member) throw new ForbiddenException('Not a member');
    if (room.type === 'GROUP' && member.role !== 'ADMIN') throw new ForbiddenException('Only admins can delete groups');
    await this.prisma.room.delete({ where: { id: roomId } });
    return { deleted: true };
  }
}
