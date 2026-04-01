import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query,
    UseGuards, Request,
} from '@nestjs/common';
import { TeamChatService } from './team-chat.service';
import { TeamChatGateway } from './team-chat.gateway';
import { SendChatMessageDto, EditChatMessageDto } from '@esmp/shared';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('team-chat')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId/chat')
export class TeamChatController {
    constructor(
        private readonly svc: TeamChatService,
        private readonly gateway: TeamChatGateway,
    ) {}

    @Get('messages')
    getMessages(
        @Param('teamId') teamId: string,
        @Request() req: any,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
    ) {
        return this.svc.getMessages(teamId, req.user.id, cursor, limit ? +limit : 50);
    }

    @Post('messages')
    async sendMessage(
        @Param('teamId') teamId: string,
        @Request() req: any,
        @Body() dto: SendChatMessageDto,
    ) {
        const msg = await this.svc.sendMessage(teamId, req.user.id, dto);
        // Broadcast to all team members via WebSocket so everyone sees it in real-time
        this.gateway.broadcastToTeam(teamId, 'new_message', msg);
        return msg;
    }

    @Patch('messages/:messageId')
    async editMessage(
        @Param('teamId') teamId: string,
        @Param('messageId') messageId: string,
        @Request() req: any,
        @Body() dto: EditChatMessageDto,
    ) {
        const msg = await this.svc.editMessage(messageId, req.user.id, dto);
        this.gateway.broadcastToTeam(teamId, 'message_updated', msg);
        return msg;
    }

    @Delete('messages/:messageId')
    async deleteMessage(
        @Param('teamId') teamId: string,
        @Param('messageId') messageId: string,
        @Request() req: any,
    ) {
        const result = await this.svc.deleteMessage(messageId, req.user.id, teamId);
        this.gateway.broadcastToTeam(teamId, 'message_deleted', { id: messageId });
        return result;
    }

    @Post('messages/:messageId/pin')
    async pinMessage(
        @Param('teamId') teamId: string,
        @Param('messageId') messageId: string,
        @Request() req: any,
    ) {
        const msg = await this.svc.pinMessage(messageId, req.user.id, teamId);
        this.gateway.broadcastToTeam(teamId, 'message_updated', msg);
        return msg;
    }

    @Delete('messages/:messageId/pin')
    async unpinMessage(
        @Param('teamId') teamId: string,
        @Param('messageId') messageId: string,
        @Request() req: any,
    ) {
        const msg = await this.svc.unpinMessage(messageId, req.user.id, teamId);
        this.gateway.broadcastToTeam(teamId, 'message_updated', msg);
        return msg;
    }

    @Get('pinned')
    getPinned(@Param('teamId') teamId: string, @Request() req: any) {
        return this.svc.getPinnedMessages(teamId, req.user.id);
    }

    @Post('messages/:messageId/read')
    markRead(
        @Param('teamId') teamId: string,
        @Param('messageId') messageId: string,
        @Request() req: any,
    ) {
        return this.svc.markRead(teamId, req.user.id, messageId);
    }

    @Get('search')
    search(
        @Param('teamId') teamId: string,
        @Request() req: any,
        @Query('q') q: string,
    ) {
        return this.svc.searchMessages(teamId, req.user.id, q || '');
    }
}
