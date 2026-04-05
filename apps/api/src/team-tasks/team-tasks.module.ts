import { Module } from '@nestjs/common';
import { TeamTasksService } from './team-tasks.service';
import { TeamTasksController } from './team-tasks.controller';
import { TaskWorkflowService } from './task-workflow.service';
import { TaskWorkflowController } from './task-workflow.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TeamTasksController, TaskWorkflowController],
    providers: [TeamTasksService, TaskWorkflowService],
    exports: [TeamTasksService, TaskWorkflowService],
})
export class TeamTasksModule {}
