export declare class CreateCalendarEventDto {
    title: string;
    description?: string;
    type?: string;
    start_date: string;
    end_date?: string;
    all_day?: boolean;
    color?: string;
}
export declare class GenerateReportDto {
    report_type: string;
    title?: string;
    filters?: Record<string, any>;
}
export declare class UpdateUserPreferencesDto {
    theme?: string;
    language?: string;
    notifications_enabled?: boolean;
    email_notifications?: boolean;
    desktop_notifications?: boolean;
    timezone?: string;
}
