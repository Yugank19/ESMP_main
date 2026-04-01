import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CompleteProfileDto,
  StudentDetailDto,
  EmployeeDetailDto,
  ManagerDetailDto,
  ClientDetailDto,
} from '@esmp/shared';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  async completeProfile(userId: string, data: CompleteProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        address: data.address,
        dob: data.dob ? new Date(data.dob) : undefined,
        bio: data.bio,
        emergency_contact: data.emergency_contact,
        onboarding_completed: true,
      },
    });
  }

  async updateStudentDetails(userId: string, data: StudentDetailDto) {
    return (this.prisma as any).studentDetail.upsert({
      where: { user_id: userId },
      create: { ...data, user_id: userId },
      update: data,
    });
  }

  async updateEmployeeDetails(userId: string, data: EmployeeDetailDto) {
    return (this.prisma as any).employeeDetail.upsert({
      where: { user_id: userId },
      create: { ...data, user_id: userId },
      update: data,
    });
  }

  async updateManagerDetails(userId: string, data: ManagerDetailDto) {
    return (this.prisma as any).managerDetail.upsert({
      where: { user_id: userId },
      create: { ...data, user_id: userId },
      update: data,
    });
  }

  async updateClientDetails(userId: string, data: ClientDetailDto) {
    return (this.prisma as any).clientDetail.upsert({
      where: { user_id: userId },
      create: { ...data, user_id: userId },
      update: data,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentDetail: true,
        employeeDetail: true,
        managerDetail: true,
        clientDetail: true,
        roles: { include: { role: true } },
      } as any,
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
