import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TaskWorkflowService } from './task-workflow.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('team-tasks')
export class TaskWorkflowController {
  constructor(private readonly workflowService: TaskWorkflowService) {}

  @Post(':taskId/start')
  start(@Param('taskId') taskId: string, @Request() req: any) {
    return this.workflowService.startTask(taskId, req.user.id);
  }

  @Post(':taskId/submit')
  submit(@Param('taskId') taskId: string, @Request() req: any, @Body() dto: any) {
    return this.workflowService.submitForReview(taskId, req.user.id, dto);
  }

  @Post(':taskId/send-to-testing')
  sendToTesting(@Param('taskId') taskId: string, @Request() req: any, @Body() body: any) {
    return this.workflowService.sendToTesting(taskId, req.user.id, body.feedback);
  }

  @Post(':taskId/pass-testing')
  passTesting(@Param('taskId') taskId: string, @Request() req: any, @Body() body: any) {
    return this.workflowService.passTesting(taskId, req.user.id, body.feedback);
  }

  @Post(':taskId/fail-testing')
  failTesting(@Param('taskId') taskId: string, @Request() req: any, @Body() body: any) {
    return this.workflowService.failTesting(taskId, req.user.id, body.feedback);
  }

  @Post(':taskId/approve')
  approve(@Param('taskId') taskId: string, @Request() req: any, @Body() body: any) {
    return this.workflowService.approveTask(taskId, req.user.id, body.feedback);
  }

  @Post(':taskId/reject')
  reject(@Param('taskId') taskId: string, @Request() req: any, @Body() body: any) {
    return this.workflowService.rejectTask(taskId, req.user.id, body.feedback);
  }

  @Get(':taskId/workflow')
  getWorkflow(@Param('taskId') taskId: string, @Request() req: any) {
    return this.workflowService.getTaskWorkflow(taskId, req.user.id);
  }
}
