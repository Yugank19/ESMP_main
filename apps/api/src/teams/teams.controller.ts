import {
    Controller, Get, Post, Patch, Delete, Body, Param,
    UseGuards, Request,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto, InviteMemberDto, UpdateMemberRoleDto, JoinTeamDto } from '@esmp/shared';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('teams')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new team' })
    create(@Request() req: any, @Body() dto: CreateTeamDto) {
        return this.teamsService.create(req.user.id, dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all teams for current user' })
    findMyTeams(@Request() req: any) {
        return this.teamsService.findMyTeams(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get team workspace (members only)' })
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.teamsService.findOne(id, req.user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update team details (leader only)' })
    update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateTeamDto) {
        return this.teamsService.update(id, req.user.id, dto);
    }

    @Patch(':id/archive')
    @ApiOperation({ summary: 'Archive team (leader only)' })
    archive(@Param('id') id: string, @Request() req: any) {
        return this.teamsService.archive(id, req.user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete team (leader only)' })
    remove(@Param('id') id: string, @Request() req: any) {
        return this.teamsService.remove(id, req.user.id);
    }

    @Post(':id/invite')
    @ApiOperation({ summary: 'Invite a member by email (leader only)' })
    invite(@Param('id') id: string, @Request() req: any, @Body() dto: InviteMemberDto) {
        return this.teamsService.inviteMember(id, req.user.id, dto);
    }

    @Post('invites/:inviteId/accept')
    @ApiOperation({ summary: 'Accept a team invite' })
    acceptInvite(@Param('inviteId') inviteId: string, @Request() req: any) {
        return this.teamsService.acceptInvite(inviteId, req.user.id);
    }

    @Post('invites/:inviteId/decline')
    @ApiOperation({ summary: 'Decline a team invite' })
    declineInvite(@Param('inviteId') inviteId: string, @Request() req: any) {
        return this.teamsService.declineInvite(inviteId, req.user.id);
    }

    @Post('join')
    @ApiOperation({ summary: 'Join a team via invite code' })
    join(@Request() req: any, @Body() dto: JoinTeamDto) {
        return this.teamsService.joinByCode(req.user.id, dto.invite_code);
    }

    @Delete(':id/members/:memberId')
    @ApiOperation({ summary: 'Remove a member (leader only)' })
    removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Request() req: any) {
        return this.teamsService.removeMember(id, req.user.id, memberId);
    }

    @Patch(':id/members/:memberId/role')
    @ApiOperation({ summary: 'Update member role (leader only)' })
    updateRole(
        @Param('id') id: string,
        @Param('memberId') memberId: string,
        @Request() req: any,
        @Body() dto: UpdateMemberRoleDto,
    ) {
        return this.teamsService.updateMemberRole(id, req.user.id, memberId, dto);
    }

    @Post(':id/regenerate-code')
    @ApiOperation({ summary: 'Regenerate invite code (leader only)' })
    regenerateCode(@Param('id') id: string, @Request() req: any) {
        return this.teamsService.regenerateInviteCode(id, req.user.id);
    }
}
