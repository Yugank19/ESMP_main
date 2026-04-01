import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TimeTrackingService } from './time-tracking.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('time-tracking')
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post()
  log(@Request() req: any, @Body() dto: any) {
    return this.timeTrackingService.logTime(req.user.id, dto);
  }

  @Get()
  getMyEntries(@Request() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.timeTrackingService.getMyEntries(req.user.id, from, to);
  }

  @Get('weekly')
  getWeekly(@Request() req: any) {
    return this.timeTrackingService.getWeeklySheet(req.user.id);
  }

  @Get('team/:teamId')
  getTeamSummary(@Param('teamId') teamId: string, @Request() req: any) {
    return this.timeTrackingService.getTeamSummary(req.user.id, teamId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.timeTrackingService.deleteEntry(id, req.user.id);
  }
}
