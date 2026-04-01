import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('global')
  getGlobal(@Request() req: any) {
    return this.analyticsService.getGlobalAnalytics(req.user.id);
  }

  @Get('team/:teamId')
  getTeamAnalytics(@Param('teamId') teamId: string, @Request() req: any) {
    return this.analyticsService.getTeamAnalytics(teamId, req.user.id);
  }
}
