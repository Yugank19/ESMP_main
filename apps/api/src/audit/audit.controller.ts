import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  getLogs(@Request() req: any, @Query() filters: any) {
    return this.auditService.getLogs(req.user.id, filters);
  }

  @Get('system')
  getSystemLogs(@Request() req: any, @Query() filters: any) {
    return this.auditService.getSystemLogs(req.user.id, filters);
  }

  @Get('action-types')
  getActionTypes() {
    return this.auditService.getActionTypes();
  }

  @Get('team/:teamId')
  getTeamLogs(@Param('teamId') teamId: string, @Request() req: any, @Query() filters: any) {
    return this.auditService.getTeamAuditLogs(teamId, req.user.id, filters);
  }
}
