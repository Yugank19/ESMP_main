export enum ProjectStatus {
    PLANNING = 'PLANNING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    ON_HOLD = 'ON_HOLD',
}

export class CreateProjectDto {
    name: string;
    description?: string;
    client_id?: string;
    team_members?: string[];
    start_date?: string;
    end_date?: string;
    priority?: string;
    deliverables?: string;
}

export class UpdateProjectDto {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    start_date?: string;
    end_date?: string;
    deliverables?: string;
}

export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    REVIEW = 'REVIEW',
    DONE = 'DONE',
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export class CreateTaskDto {
    project_id: string;
    title: string;
    description?: string;
    assignee_id?: string;
    priority?: TaskPriority;
    due_date?: string;
    attachments?: string[];
}

export class UpdateTaskDto {
    title?: string;
    description?: string;
    assignee_id?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    due_date?: string;
    time_logged?: number;
    attachments?: string[];
}
