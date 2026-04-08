import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { roomId: string; senderId: string; body: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Verify membership
    const membership = await this.prisma.roomMember.findUnique({
      where: {
        room_id_user_id: { room_id: data.roomId, user_id: data.senderId },
      },
    });

    if (!membership) {
      return { error: 'Not a member of this room' };
    }

    const message = await this.prisma.message.create({
      data: {
        room_id: data.roomId,
        sender_id: data.senderId,
        body: data.body,
      },
      include: { 
        sender: {
          select: { id: true, name: true, avatar_url: true }
        } 
      },
    });

    // Update room updated_at
    await this.prisma.room.update({
      where: { id: data.roomId },
      data: { updated_at: new Date() }
    });

    // Broadcast to people in the room
    this.server.to(data.roomId).emit('newMessage', message);
    return message;
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const membership = await this.prisma.roomMember.findUnique({
      where: { room_id_user_id: { room_id: data.roomId, user_id: data.userId } },
    });
    if (membership) { client.join(data.roomId); return { room: data.roomId }; }
    return { error: 'Forbidden' };
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody() data: { messageId: string; roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const msg = await this.prisma.message.findUnique({ where: { id: data.messageId } });
    if (!msg || msg.sender_id !== data.userId) return { error: 'Forbidden' };
    await this.prisma.message.delete({ where: { id: data.messageId } });
    this.server.to(data.roomId).emit('messageDeleted', { messageId: data.messageId, room_id: data.roomId });
    return { deleted: true };
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @MessageBody() data: { messageId: string; roomId: string; userId: string; body: string },
    @ConnectedSocket() client: Socket,
  ) {
    const msg = await this.prisma.message.findUnique({ where: { id: data.messageId } });
    if (!msg || msg.sender_id !== data.userId) return { error: 'Forbidden' };
    const updated = await this.prisma.message.update({
      where: { id: data.messageId },
      data: { body: data.body.trim(), attachments: { ...(msg.attachments as any || {}), edited: true } },
      include: { sender: { select: { id: true, name: true, avatar_url: true } } },
    });
    this.server.to(data.roomId).emit('messageEdited', updated);
    return updated;
  }
}

