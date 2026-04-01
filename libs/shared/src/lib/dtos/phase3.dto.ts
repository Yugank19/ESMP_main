import { IsString, IsNotEmpty, IsOptional, IsIn, IsArray, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ── Team Tasks ────────────────────────────────────────────────────────────────

export class CreateTeamTaskDto {
    @IsString() @IsNotEmpty() @ApiProperty()
    title: string;

    @IsString() @IsOptional() @ApiProperty({ required: false })
    description?: string;

    @IsArray() @IsOptional() @ApiProperty({ required: false, type: [String] })
    assignee_ids?: string[];

    @IsString() @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']) @IsOptional()
    @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' })
    priority?: string;

    @IsDateString() @IsOptional() @ApiProperty({ required: false })
    start_date?: string;

    @IsDateString() @IsOptional() @ApiProperty({ required: false })
    due_date?: string;

    @IsNumber() @IsOptional() @ApiProperty({ required: false })
    estimate_hours?: number;
}

export class UpdateTeamTaskDto {
    @IsString() @IsOptional() @ApiProperty({ required: false })
    title?: string;

    @IsString() @IsOptional() @ApiProperty({ required: false })
    description?: string;

    @IsArray() @IsOptional() @ApiProperty({ required: false, type: [String] })
    assignee_ids?: string[];

    @IsString() @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']) @IsOptional()
    @ApiProperty({ required: false })
    priority?: string;

    @IsString() @IsIn(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']) @IsOptional()
    @ApiProperty({ required: false })
    status?: string;

    @IsDateString() @IsOptional() @ApiProperty({ required: false })
    start_date?: string;

    @IsDateString() @IsOptional() @ApiProperty({ required: false })
    due_date?: string;

    @IsNumber() @IsOptional() @ApiProperty({ required: false })
    estimate_hours?: number;
}

export class AddTaskCommentDto {
    @IsString() @IsNotEmpty() @ApiProperty()
    body: string;
}

// ── Milestones ────────────────────────────────────────────────────────────────

export class CreateMilestoneDto {
    @IsString() @IsNotEmpty() @ApiProperty()
    name: string;

    @IsString() @IsOptional() @ApiProperty({ required: false })
    description?: string;

    @IsDateString() @IsOptional() @ApiProperty({ required: false })
    start_date?: string;

    @IsDateString() @IsOptional() @ApiProperty({ required: false })
    target_date?: string;

    @IsArray() @IsOptional() @ApiProperty({ required: false, type: [String] })
    task_ids?: string[];
}

export class UpdateMilestoneDto {
    @IsString() @IsOptional() @ApiProperty({ required: false })
    name?: string;

    @IsString() @IsOptional() @ApiProperty({ required: false })
    description?: string;

    @IsString() @IsIn(['NOT_STARTED', 'ONGOING', 'COMPLETED']) @IsOptional()
    @ApiProperty({ required: false })
    status?: string;

    @IsDateString() @IsOptional() @ApiProperty({ required: false })
    start_date?: string;

    @IsDateString() @IsOptional() @ApiProperty({ required: false })
    target_date?: string;

    @IsArray() @IsOptional() @ApiProperty({ required: false, type: [String] })
    task_ids?: string[];
}

// ── Progress Updates ──────────────────────────────────────────────────────────

export class CreateProgressUpdateDto {
    @IsString() @IsNotEmpty() @ApiProperty()
    completed: string;

    @IsString() @IsOptional() @ApiProperty({ required: false })
    task_progress?: string;

    @IsString() @IsOptional() @ApiProperty({ required: false })
    blockers?: string;

    @IsString() @IsOptional() @ApiProperty({ required: false })
    next_plan?: string;
}
