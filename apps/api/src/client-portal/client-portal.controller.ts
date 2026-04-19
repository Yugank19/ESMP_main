import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ClientPortalService } from './client-portal.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('client-portal')
export class ClientPortalController {
  constructor(private readonly svc: ClientPortalService) {}

  // ── Manager endpoints ─────────────────────────────────────────────────────────
  @Post('clients')
  createClient(@Request() req: any, @Body() dto: any) { return this.svc.createClient(req.user.id, dto); }

  @Get('clients')
  getMyClients(@Request() req: any) { return this.svc.getMyClients(req.user.id); }

  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.svc.updateClientProject(id, req.user.id, dto); }

  @Post('projects/:id/deliverables')
  addDeliverable(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.svc.addDeliverable(id, req.user.id, dto); }

  @Delete('deliverables/:id')
  deleteDeliverable(@Param('id') id: string, @Request() req: any) { return this.svc.deleteDeliverable(id, req.user.id); }

  @Post('projects/:id/milestones')
  addMilestone(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.svc.addMilestone(id, req.user.id, dto); }

  @Patch('milestones/:id')
  updateMilestone(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.svc.updateMilestone(id, req.user.id, dto); }

  // ── Client endpoints ──────────────────────────────────────────────────────────
  @Get('dashboard')
  getDashboard(@Request() req: any) { return this.svc.getClientDashboard(req.user.id); }

  @Get('projects/:id')
  getProject(@Param('id') id: string, @Request() req: any) { return this.svc.getClientProject(id, req.user.id); }

  @Get('projects/:id/activity')
  getActivity(@Param('id') id: string, @Request() req: any) { return this.svc.getProjectActivity(id, req.user.id); }

  @Get('projects/:id/report')
  getReport(@Param('id') id: string, @Request() req: any) { return this.svc.getProjectReport(id, req.user.id); }

  @Post('deliverables/:id/approve')
  approve(@Param('id') id: string, @Request() req: any, @Body() body: any) { return this.svc.approveDeliverable(id, req.user.id, body.feedback); }

  @Post('deliverables/:id/reject')
  reject(@Param('id') id: string, @Request() req: any, @Body() body: any) { return this.svc.rejectDeliverable(id, req.user.id, body.feedback); }

  @Post('projects/:id/feedback')
  addFeedback(@Param('id') id: string, @Request() req: any, @Body() body: any) { return this.svc.addFeedback(id, req.user.id, body.body, body.type); }

  @Get('notifications')
  getNotifications(@Request() req: any) { return this.svc.getClientNotifications(req.user.id); }

  @Patch('notifications/:id/read')
  markRead(@Param('id') id: string, @Request() req: any) { return this.svc.markNotificationRead(id, req.user.id); }

  @Patch('notifications/read-all')
  markAllRead(@Request() req: any) { return this.svc.markAllNotificationsRead(req.user.id); }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() dto: any) { return this.svc.updateClientProfile(req.user.id, dto); }
}
