import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('team/:teamId/generate')
  generate(@Param('teamId') teamId: string, @Request() req: any, @Body() dto: any) {
    return this.reportsService.generateReport(teamId, req.user.id, dto);
  }

  @Get('team/:teamId')
  getTeamReports(@Param('teamId') teamId: string, @Request() req: any) {
    return this.reportsService.getReports(teamId, req.user.id);
  }

  @Get(':reportId')
  getReport(@Param('reportId') reportId: string, @Request() req: any) {
    return this.reportsService.getReport(reportId, req.user.id);
  }
}
