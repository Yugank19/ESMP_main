import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: any) {
    return this.approvalsService.createRequest(req.user.id, dto);
  }

  @Get('my-requests')
  myRequests(@Request() req: any) {
    return this.approvalsService.getMyRequests(req.user.id);
  }

  @Get('pending-for-me')
  pendingForMe(@Request() req: any) {
    return this.approvalsService.getPendingForMe(req.user.id);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Request() req: any) {
    return this.approvalsService.getRequest(id, req.user.id);
  }

  @Post('steps/:stepId/act')
  act(@Param('stepId') stepId: string, @Request() req: any, @Body() body: any) {
    return this.approvalsService.act(stepId, req.user.id, body.action, body.comment);
  }
}
