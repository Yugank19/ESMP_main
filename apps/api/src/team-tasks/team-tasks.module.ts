import { Module } from '@nestjs/common';
import { TeamTasksService } from './team-tasks.service';
import { TeamTasksController } from './team-tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TeamTasksController],
    providers: [TeamTasksService],
    exports: [TeamTasksService],
})
export class TeamTasksModule {}
