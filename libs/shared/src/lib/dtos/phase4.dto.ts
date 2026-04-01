import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber } from 'class-validator';

// ── Chat ──────────────────────────────────────────────────────────────────────

export class SendChatMessageDto {
    @IsString() body: string;
    @IsOptional() @IsString() type?: string;
    @IsOptional() @IsString() file_url?: string;
    @IsOptional() @IsString() file_name?: string;
    @IsOptional() @IsNumber() file_size?: number;
}

export class EditChatMessageDto {
    @IsString() body: string;
}

// ── Files ─────────────────────────────────────────────────────────────────────

export class CreateFolderDto {
    @IsString() name: string;
    @IsOptional() @IsString() parent_id?: string;
}

export class UpdateFileDto {
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsBoolean() is_important?: boolean;
    @IsOptional() @IsString() folder_id?: string;
}

export class AddFileCommentDto {
    @IsString() body: string;
}

// ── Announcements ─────────────────────────────────────────────────────────────

export class CreateAnnouncementDto {
    @IsString() title: string;
    @IsString() body: string;
    @IsOptional() @IsBoolean() is_pinned?: boolean;
}

export class UpdateAnnouncementDto {
    @IsOptional() @IsString() title?: string;
    @IsOptional() @IsString() body?: string;
    @IsOptional() @IsBoolean() is_pinned?: boolean;
}

// ── Meeting Notes ─────────────────────────────────────────────────────────────

export class CreateMeetingNoteDto {
    @IsString() title: string;
    @IsDateString() meeting_date: string;
    @IsOptional() @IsString() agenda?: string;
    @IsOptional() @IsString() attendees?: string;
    @IsOptional() @IsString() discussion?: string;
    @IsOptional() @IsString() action_items?: string;
    @IsOptional() @IsString() follow_up?: string;
}

export class UpdateMeetingNoteDto {
    @IsOptional() @IsString() title?: string;
    @IsOptional() @IsDateString() meeting_date?: string;
    @IsOptional() @IsString() agenda?: string;
    @IsOptional() @IsString() attendees?: string;
    @IsOptional() @IsString() discussion?: string;
    @IsOptional() @IsString() action_items?: string;
    @IsOptional() @IsString() follow_up?: string;
}
