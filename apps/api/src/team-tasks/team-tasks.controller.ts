import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query,
    UseGuards, Request,
} from '@nestjs/common';
import { TeamTasksService } from './team-tasks.service';
import {
    CreateTeamTaskDto, UpdateTeamTaskDto, AddTaskCommentDto,
    CreateMilestoneDto, UpdateMilestoneDto, CreateProgressUpdateDto,
} from '@esmp/shared';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('team-tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId')
export class TeamTasksController {
    constructor(private readonly svc: TeamTasksService) {}

    // ── Tasks ─────────────────────────────────────────────────────────────────

    @Post('tasks')
    @ApiOperation({ summary: 'Create a task (leader only)' })
    createTask(@Param('teamId') teamId: string, @Request() req: any, @Body() dto: CreateTeamTaskDto) {
        return this.svc.createTask(teamId, req.user.id, dto);
    }

    @Get('tasks')
    @ApiOperation({ summary: 'Get all tasks for a team' })
    getTasks(
        @Param('teamId') teamId: string,
        @Request() req: any,
        @Query('status') status?: string,
        @Query('priority') priority?: string,
        @Query('assignee_id') assignee_id?: string,
        @Query('search') search?: string,
    ) {
        return this.svc.getTeamTasks(teamId, req.user.id, { status, priority, assignee_id, search });
    }

    @Get('tasks/:taskId')
    @ApiOperation({ summary: 'Get a single task' })
    getTask(@Param('taskId') taskId: string, @Request() req: any) {
        return this.svc.getTask(taskId, req.user.id);
    }

    @Patch('tasks/:taskId')
    @ApiOperation({ summary: 'Update a task' })
    updateTask(@Param('taskId') taskId: string, @Request() req: any, @Body() dto: UpdateTeamTaskDto) {
        return this.svc.updateTask(taskId, req.user.id, dto);
    }

    @Delete('tasks/:taskId')
    @ApiOperation({ summary: 'Delete a task (leader only)' })
    deleteTask(@Param('taskId') taskId: string, @Request() req: any) {
        return this.svc.deleteTask(taskId, req.user.id);
    }

    // ── Comments ──────────────────────────────────────────────────────────────

    @Post('tasks/:taskId/comments')
    @ApiOperation({ summary: 'Add a comment to a task' })
    addComment(@Param('taskId') taskId: string, @Request() req: any, @Body() dto: AddTaskCommentDto) {
        return this.svc.addComment(taskId, req.user.id, dto);
    }

    @Delete('tasks/:taskId/comments/:commentId')
    @ApiOperation({ summary: 'Delete a comment' })
    deleteComment(@Param('commentId') commentId: string, @Request() req: any) {
        return this.svc.deleteComment(commentId, req.user.id);
    }

    // ── Milestones ────────────────────────────────────────────────────────────

    @Post('milestones')
    @ApiOperation({ summary: 'Create a milestone (leader only)' })
    createMilestone(@Param('teamId') teamId: string, @Request() req: any, @Body() dto: CreateMilestoneDto) {
        return this.svc.createMilestone(teamId, req.user.id, dto);
    }

    @Get('milestones')
    @ApiOperation({ summary: 'Get all milestones for a team' })
    getMilestones(@Param('teamId') teamId: string, @Request() req: any) {
        return this.svc.getTeamMilestones(teamId, req.user.id);
    }

    @Patch('milestones/:milestoneId')
    @ApiOperation({ summary: 'Update a milestone (leader only)' })
    updateMilestone(@Param('milestoneId') milestoneId: string, @Request() req: any, @Body() dto: UpdateMilestoneDto) {
        return this.svc.updateMilestone(milestoneId, req.user.id, dto);
    }

    @Delete('milestones/:milestoneId')
    @ApiOperation({ summary: 'Delete a milestone (leader only)' })
    deleteMilestone(@Param('milestoneId') milestoneId: string, @Request() req: any) {
        return this.svc.deleteMilestone(milestoneId, req.user.id);
    }

    // ── Progress Updates ──────────────────────────────────────────────────────

    @Post('progress')
    @ApiOperation({ summary: 'Submit a daily progress update' })
    createProgress(@Param('teamId') teamId: string, @Request() req: any, @Body() dto: CreateProgressUpdateDto) {
        return this.svc.createProgressUpdate(teamId, req.user.id, dto);
    }

    @Get('progress')
    @ApiOperation({ summary: 'Get all progress updates for a team' })
    getProgress(@Param('teamId') teamId: string, @Request() req: any) {
        return this.svc.getProgressUpdates(teamId, req.user.id);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @Get('stats')
    @ApiOperation({ summary: 'Get project dashboard stats' })
    getStats(@Param('teamId') teamId: string, @Request() req: any) {
        return this.svc.getTeamStats(teamId, req.user.id);
    }
}
