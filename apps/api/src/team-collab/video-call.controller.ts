import { Controller, Post, Param, Request, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId/video-call')
export class VideoCallController {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  @Post('start')
  async startCall(@Param('teamId') teamId: string, @Request() req: any) {
    const userId = req.user.id;

    // Verify caller is a team member
    const membership = await this.prisma.teamMember.findFirst({
      where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
    });
    if (!membership) throw new ForbiddenException('Not a team member');

    const [team, caller, members] = await Promise.all([
      this.prisma.team.findUnique({ where: { id: teamId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } }),
      this.prisma.teamMember.findMany({
        where: { team_id: teamId, status: 'ACTIVE', user_id: { not: userId } },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    if (!team) throw new ForbiddenException('Team not found');

    const roomName = `esmp-team-${teamId.replace(/-/g, '').slice(0, 16)}`;
    const meetingLink = `https://meet.jit.si/${roomName}`;

    // Send in-app notification to all other members
    if (members.length > 0) {
      await this.prisma.notification.createMany({
        data: members.map(m => ({
          user_id: m.user_id,
          type: 'VIDEO_CALL_STARTED',
          payload: {
            team_id: teamId,
            team_name: team.name,
            started_by: caller?.name,
            meeting_link: meetingLink,
            message: `${caller?.name} started a video call in "${team.name}". Click to join.`,
          },
        })),
        skipDuplicates: true,
      });

      // Send email to all members (fire and forget — don't block response)
      Promise.allSettled(
        members.map(m =>
          this.mailService.sendVideoCallInvite(
            m.user.email,
            m.user.name,
            caller?.name || 'A team member',
            team.name,
            meetingLink,
          )
        )
      );
    }

    // Log activity
    await this.prisma.teamActivity.create({
      data: {
        team_id: teamId,
        user_id: userId,
        action: 'VIDEO_CALL_STARTED',
        description: `${caller?.name} started a video conference`,
      },
    });

    return {
      message: `Notifications sent to ${members.length} member(s)`,
      meeting_link: meetingLink,
      notified: members.length,
    };
  }
}
