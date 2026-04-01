import { Module } from '@nestjs/common';
import { TeamFilesService } from './team-files.service';
import { TeamFilesController } from './team-files.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TeamFilesController],
    providers: [TeamFilesService],
})
export class TeamFilesModule {}
