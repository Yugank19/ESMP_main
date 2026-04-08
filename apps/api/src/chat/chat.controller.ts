import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@UseGuards(AuthGuard('jwt'))
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('search')
  searchUser(@Query('email') email: string) { return this.chatService.searchUserByEmail(email); }

  @Get('users/:id/profile')
  getUserProfile(@Param('id') id: string) { return this.chatService.getUserProfile(id); }

  @Get('rooms')
  getRooms(@Request() req: any) { return this.chatService.getUserRooms(req.user.id); }

  @Get('rooms/:roomId/messages')
  getMessages(@Param('roomId') roomId: string, @Request() req: any) { return this.chatService.getRoomMessages(roomId, req.user.id); }

  @Post('rooms/group')
  createGroup(@Body('name') name: string, @Body('emails') emails: string[], @Request() req: any) {
    return this.chatService.createGroup(req.user.id, name, emails);
  }

  @Patch('rooms/:roomId/rename')
  renameGroup(@Param('roomId') roomId: string, @Body('name') name: string, @Request() req: any) {
    return this.chatService.renameGroup(roomId, req.user.id, name);
  }

  @Post('rooms/:roomId/members')
  addMember(@Param('roomId') roomId: string, @Body('email') email: string, @Request() req: any) {
    return this.chatService.addGroupMember(roomId, req.user.id, email);
  }

  @Delete('rooms/:roomId/members/:memberId')
  removeMember(@Param('roomId') roomId: string, @Param('memberId') memberId: string, @Request() req: any) {
    return this.chatService.removeGroupMember(roomId, req.user.id, memberId);
  }

  @Post('rooms/:roomId/leave')
  leaveGroup(@Param('roomId') roomId: string, @Request() req: any) {
    return this.chatService.leaveGroup(roomId, req.user.id);
  }

  @Delete('rooms/:roomId')
  deleteRoom(@Param('roomId') roomId: string, @Request() req: any) {
    return this.chatService.deleteRoom(roomId, req.user.id);
  }

  @Delete('messages/:messageId')
  deleteMessage(@Param('messageId') messageId: string, @Request() req: any) {
    return this.chatService.deleteMessage(messageId, req.user.id);
  }

  @Patch('messages/:messageId')
  editMessage(@Param('messageId') messageId: string, @Body('body') body: string, @Request() req: any) {
    return this.chatService.editMessage(messageId, req.user.id, body);
  }

  @Post('requests')
  sendRequest(@Body('email') email: string, @Request() req: any) { return this.chatService.sendChatRequest(req.user.id, email); }

  @Get('requests/pending')
  getPendingRequests(@Request() req: any) { return this.chatService.getPendingRequests(req.user.id); }

  @Patch('requests/:requestId')
  respondRequest(@Param('requestId') requestId: string, @Body('status') status: 'ACCEPTED' | 'REJECTED', @Request() req: any) {
    return this.chatService.respondToRequest(requestId, status, req.user.id);
  }
}
