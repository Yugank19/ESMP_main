import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ClientPortalService } from './client-portal.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('client-portal')
export class ClientPortalController {
  constructor(private readonly svc: ClientPortalService) {}

  // Manager endpoints
  @Post('clients')
  createClient(@Request() req: any, @Body() dto: any) { return this.svc.createClient(req.user.id, dto); }

  @Get('clients')
  getMyClients(@Request() req: any) { return this.svc.getMyClients(req.user.id); }

  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.svc.updateClientProject(id, req.user.id, dto); }

  @Post('projects/:id/deliverables')
  addDeliverable(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.svc.addDeliverable(id, req.user.id, dto); }

  @Post('projects/:id/milestones')
  addMilestone(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.svc.addMilestone(id, req.user.id, dto); }

  // Client endpoints
  @Get('dashboard')
  getDashboard(@Request() req: any) { return this.svc.getClientDashboard(req.user.id); }

  @Get('projects/:id')
  getProject(@Param('id') id: string, @Request() req: any) { return this.svc.getClientProject(id, req.user.id); }

  @Post('deliverables/:id/approve')
  approve(@Param('id') id: string, @Request() req: any, @Body() body: any) { return this.svc.approveDeliverable(id, req.user.id, body.feedback); }

  @Post('deliverables/:id/reject')
  reject(@Param('id') id: string, @Request() req: any, @Body() body: any) { return this.svc.rejectDeliverable(id, req.user.id, body.feedback); }

  @Post('projects/:id/feedback')
  addFeedback(@Param('id') id: string, @Request() req: any, @Body() body: any) { return this.svc.addFeedback(id, req.user.id, body.body, body.type); }
}
