export declare class SendChatMessageDto {
    body: string;
    type?: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
}
export declare class EditChatMessageDto {
    body: string;
}
export declare class CreateFolderDto {
    name: string;
    parent_id?: string;
}
export declare class UpdateFileDto {
    name?: string;
    description?: string;
    is_important?: boolean;
    folder_id?: string;
}
export declare class AddFileCommentDto {
    body: string;
}
export declare class CreateAnnouncementDto {
    title: string;
    body: string;
    is_pinned?: boolean;
}
export declare class UpdateAnnouncementDto {
    title?: string;
    body?: string;
    is_pinned?: boolean;
}
export declare class CreateMeetingNoteDto {
    title: string;
    meeting_date: string;
    agenda?: string;
    attendees?: string;
    discussion?: string;
    action_items?: string;
    follow_up?: string;
}
export declare class UpdateMeetingNoteDto {
    title?: string;
    meeting_date?: string;
    agenda?: string;
    attendees?: string;
    discussion?: string;
    action_items?: string;
    follow_up?: string;
}
