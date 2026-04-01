export declare class CreateTeamTaskDto {
    title: string;
    description?: string;
    assignee_ids?: string[];
    priority?: string;
    start_date?: string;
    due_date?: string;
    estimate_hours?: number;
}
export declare class UpdateTeamTaskDto {
    title?: string;
    description?: string;
    assignee_ids?: string[];
    priority?: string;
    status?: string;
    start_date?: string;
    due_date?: string;
    estimate_hours?: number;
}
export declare class AddTaskCommentDto {
    body: string;
}
export declare class CreateMilestoneDto {
    name: string;
    description?: string;
    start_date?: string;
    target_date?: string;
    task_ids?: string[];
}
export declare class UpdateMilestoneDto {
    name?: string;
    description?: string;
    status?: string;
    start_date?: string;
    target_date?: string;
    task_ids?: string[];
}
export declare class CreateProgressUpdateDto {
    completed: string;
    task_progress?: string;
    blockers?: string;
    next_plan?: string;
}
