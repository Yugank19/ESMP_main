import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from '@esmp/shared';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(@Request() req: any, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(req.user.id, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tasks' })
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task details' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task details' })
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Quick update task status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tasksService.updateStatus(id, status);
  }

  @Post(':id/approvals')
  @ApiOperation({ summary: 'Create an approval request for a task' })
  createApproval(
    @Param('id') id: string,
    @Body('approverId') approverId: string,
    @Body('comments') comments?: string,
  ) {
    return this.tasksService.createApproval(id, approverId, comments);
  }

  @Patch('approvals/:approvalId')
  @ApiOperation({ summary: 'Respond to an approval request' })
  respondToApproval(
    @Param('approvalId') approvalId: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('comments') comments?: string,
  ) {
    return this.tasksService.respondToApproval(approvalId, status, comments);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
