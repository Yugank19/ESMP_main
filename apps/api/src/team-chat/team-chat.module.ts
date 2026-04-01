import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TeamChatService } from './team-chat.service';
import { TeamChatController } from './team-chat.controller';
import { TeamChatGateway } from './team-chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET'),
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [TeamChatController],
    providers: [TeamChatService, TeamChatGateway],
    exports: [TeamChatGateway],
})
export class TeamChatModule {}
