import {
  Controller, Get, Post, Body, Param, Delete, Put,
  UseGuards, Request, ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(AuthGuard('jwt'))
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertAdmin(userId: string) {
    const roles = await this.prisma.userRole.findMany({
      where: { user_id: userId },
      include: { role: true },
    });
    const isAdmin = roles.some(r => r.role.name.toUpperCase() === 'ADMIN');
    if (!isAdmin) throw new ForbiddenException('Admin access required');
  }

  @Get('users')
  async getAllUsers(@Request() req: any) {
    await this.assertAdmin(req.user.id);
    return this.adminService.getAllUsers();
  }

  @Put('users/:id/role')
  async updateUserRole(@Request() req: any, @Param('id') id: string, @Body('role') role: string) {
    await this.assertAdmin(req.user.id);
    return this.adminService.updateUserRole(id, role);
  }

  @Delete('users/:id')
  async deleteUser(@Request() req: any, @Param('id') id: string) {
    await this.assertAdmin(req.user.id);
    if (id === req.user.id) throw new ForbiddenException('Cannot delete your own account');
    return this.adminService.deleteUser(id);
  }

  @Get('settings')
  async getSettings(@Request() req: any) {
    await this.assertAdmin(req.user.id);
    return this.adminService.getSystemSettings();
  }

  @Get('stats')
  async getStats(@Request() req: any) {
    await this.assertAdmin(req.user.id);
    const [users, teams, tickets, bugs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.team.count({ where: { status: 'ACTIVE' } }),
      this.prisma.ticket.count(),
      this.prisma.bug.count(),
    ]);
    return { users, teams, tickets, bugs };
  }
}
