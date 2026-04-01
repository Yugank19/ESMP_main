import {
    WebSocketGateway, WebSocketServer, SubscribeMessage,
    MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: { origin: '*', credentials: false },
    namespace: '/team-chat',
})
export class TeamChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    private onlineUsers = new Map<string, Set<string>>();

    constructor(private jwtService: JwtService) {}

    handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth?.token ||
                (client.handshake.headers?.authorization as string)?.split(' ')[1];
            if (!token) { client.disconnect(); return; }
            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub;
            const userId: string = payload.sub;
            if (!this.onlineUsers.has(userId)) this.onlineUsers.set(userId, new Set());
            this.onlineUsers.get(userId)!.add(client.id);
            // Tell everyone this user is online
            this.server.emit('user_online', { userId });
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId: string = client.data.userId;
        if (!userId) return;
        const sockets = this.onlineUsers.get(userId);
        if (sockets) {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.onlineUsers.delete(userId);
                this.server.emit('user_offline', { userId });
            }
        }
    }

    @SubscribeMessage('join_team')
    handleJoinTeam(@MessageBody() teamId: string, @ConnectedSocket() client: Socket) {
        client.join(`team:${teamId}`);
        return { joined: teamId };
    }

    @SubscribeMessage('leave_team')
    handleLeaveTeam(@MessageBody() teamId: string, @ConnectedSocket() client: Socket) {
        client.leave(`team:${teamId}`);
    }

    @SubscribeMessage('typing_start')
    handleTypingStart(
        @MessageBody() data: { teamId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.to(`team:${data.teamId}`).emit('user_typing', {
            userId: client.data.userId,
        });
    }

    @SubscribeMessage('typing_stop')
    handleTypingStop(
        @MessageBody() data: { teamId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.to(`team:${data.teamId}`).emit('user_stopped_typing', {
            userId: client.data.userId,
        });
    }

    /** Called by the controller after saving a message to DB */
    broadcastToTeam(teamId: string, event: string, data: any) {
        this.server.to(`team:${teamId}`).emit(event, data);
    }

    isOnline(userId: string): boolean {
        return this.onlineUsers.has(userId);
    }
}
