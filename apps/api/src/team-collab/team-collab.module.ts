import { Module } from '@nestjs/common';
import { TeamCollabService } from './team-collab.service';
import { TeamCollabController } from './team-collab.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TeamCollabController],
    providers: [TeamCollabService],
})
export class TeamCollabModule {}
