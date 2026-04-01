import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { WorkloadService } from './workload.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('workload')
export class WorkloadController {
  constructor(private readonly workloadService: WorkloadService) {}

  @Get('me')
  getMyWorkload(@Request() req: any) {
    return this.workloadService.getMyWorkload(req.user.id);
  }

  @Get('team/:teamId')
  getTeamWorkload(@Param('teamId') teamId: string, @Request() req: any) {
    return this.workloadService.getTeamWorkload(teamId, req.user.id);
  }
}
