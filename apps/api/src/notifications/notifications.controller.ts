import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
    constructor(private prisma: PrismaService) {}

    @Get()
    async getAll(@Request() req: any) {
        return this.prisma.notification.findMany({
            where: { user_id: req.user.id },
            orderBy: { created_at: 'desc' },
            take: 50,
        });
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req: any) {
        const count = await this.prisma.notification.count({
            where: { user_id: req.user.id, read: false },
        });
        return { count };
    }

    @Patch(':id/read')
    async markRead(@Param('id') id: string, @Request() req: any) {
        return this.prisma.notification.updateMany({
            where: { id, user_id: req.user.id },
            data: { read: true },
        });
    }

    @Patch('read-all')
    async markAllRead(@Request() req: any) {
        return this.prisma.notification.updateMany({
            where: { user_id: req.user.id, read: false },
            data: { read: true },
        });
    }
}
