import {
    Controller, Get, Post, Patch, Delete, Body, Param,
    UseGuards, Request,
} from '@nestjs/common';
import { TeamCollabService } from './team-collab.service';
import {
    CreateAnnouncementDto, UpdateAnnouncementDto,
    CreateMeetingNoteDto, UpdateMeetingNoteDto,
} from '@esmp/shared';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('team-collab')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId')
export class TeamCollabController {
    constructor(private readonly svc: TeamCollabService) {}

    // ── Announcements ─────────────────────────────────────────────────────────

    @Post('announcements')
    createAnnouncement(@Param('teamId') teamId: string, @Request() req: any, @Body() dto: CreateAnnouncementDto) {
        return this.svc.createAnnouncement(teamId, req.user.id, dto);
    }

    @Get('announcements')
    getAnnouncements(@Param('teamId') teamId: string, @Request() req: any) {
        return this.svc.getAnnouncements(teamId, req.user.id);
    }

    @Patch('announcements/:annId')
    updateAnnouncement(@Param('teamId') teamId: string, @Param('annId') annId: string, @Request() req: any, @Body() dto: UpdateAnnouncementDto) {
        return this.svc.updateAnnouncement(annId, req.user.id, teamId, dto);
    }

    @Delete('announcements/:annId')
    deleteAnnouncement(@Param('teamId') teamId: string, @Param('annId') annId: string, @Request() req: any) {
        return this.svc.deleteAnnouncement(annId, req.user.id, teamId);
    }

    // ── Meeting Notes ─────────────────────────────────────────────────────────

    @Post('meetings')
    createMeeting(@Param('teamId') teamId: string, @Request() req: any, @Body() dto: CreateMeetingNoteDto) {
        return this.svc.createMeetingNote(teamId, req.user.id, dto);
    }

    @Get('meetings')
    getMeetings(@Param('teamId') teamId: string, @Request() req: any) {
        return this.svc.getMeetingNotes(teamId, req.user.id);
    }

    @Get('meetings/:noteId')
    getMeeting(@Param('teamId') teamId: string, @Param('noteId') noteId: string, @Request() req: any) {
        return this.svc.getMeetingNote(noteId, req.user.id, teamId);
    }

    @Patch('meetings/:noteId')
    updateMeeting(@Param('teamId') teamId: string, @Param('noteId') noteId: string, @Request() req: any, @Body() dto: UpdateMeetingNoteDto) {
        return this.svc.updateMeetingNote(noteId, req.user.id, teamId, dto);
    }

    @Delete('meetings/:noteId')
    deleteMeeting(@Param('teamId') teamId: string, @Param('noteId') noteId: string, @Request() req: any) {
        return this.svc.deleteMeetingNote(noteId, req.user.id, teamId);
    }

    // ── Activity Feed ─────────────────────────────────────────────────────────

    @Get('activity')
    getActivity(@Param('teamId') teamId: string, @Request() req: any) {
        return this.svc.getActivityFeed(teamId, req.user.id);
    }
}
