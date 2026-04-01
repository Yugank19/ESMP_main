import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      include: { roles: { include: { role: true } } },
    });
  }

  async updateUserRole(userId: string, roleName: string) {
    const role = await this.prisma.role.findUnique({
      where: { name: roleName.toUpperCase() },
    });
    if (!role) throw new NotFoundException('Role not found');

    // Remove old roles and add new one (assuming one role for now, or append)
    await this.prisma.userRole.deleteMany({ where: { user_id: userId } });
    return this.prisma.userRole.create({
      data: { user_id: userId, role_id: role.id },
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
  }

  async getSystemSettings() {
    // Mocking system settings for now
    return {
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationMandatory: true,
    };
  }
}
