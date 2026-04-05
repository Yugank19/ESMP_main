import { Module } from '@nestjs/common';
import { TeamCollabService } from './team-collab.service';
import { TeamCollabController } from './team-collab.controller';
import { VideoCallController } from './video-call.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
    imports: [PrismaModule, MailModule],
    controllers: [TeamCollabController, VideoCallController],
    providers: [TeamCollabService],
})
export class TeamCollabModule {}
