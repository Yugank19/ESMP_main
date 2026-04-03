import { Injectable, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';

const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Design', 'Legal', 'IT', 'Support'];

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async assertManagerOrAdmin(userId: string) {
    const roles = await this.prisma.userRole.findMany({
      where: { user_id: userId },
      include: { role: true },
    });
    const names = roles.map(r => r.role.name.toUpperCase());
    if (!names.some(r => ['MANAGER', 'ADMIN'].includes(r))) {
      throw new ForbiddenException('Only managers and admins can create employee accounts');
    }
    return names;
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    return pwd;
  }

  // ── Step 1: Manager sends OTP to employee email ──────────────────────────────
  async sendEmployeeOtp(managerId: string, email: string) {
    await this.assertManagerOrAdmin(managerId);

    if (!email.endsWith('@gmail.com')) {
      throw new BadRequestException('Only Gmail addresses are allowed');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    // Use (prisma as any) — same pattern as auth service
    await (this.prisma as any).otpRequest.upsert({
      where: { email },
      create: { email, otp_code: otp, expires_at, verified: false },
      update: { otp_code: otp, expires_at, verified: false },
    });

    await this.mailService.sendOtpEmail(email, otp);
    return { message: `OTP sent to ${email}. Valid for 10 minutes.` };
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────────
  async verifyEmployeeOtp(managerId: string, email: string, otp: string) {
    await this.assertManagerOrAdmin(managerId);

    const record = await (this.prisma as any).otpRequest.findUnique({ where: { email } });
    if (!record) throw new BadRequestException('No OTP found for this email. Send OTP first.');
    if (new Date() > record.expires_at) throw new BadRequestException('OTP has expired. Please resend.');
    if (record.otp_code !== otp) throw new BadRequestException('Invalid OTP. Please try again.');

    await (this.prisma as any).otpRequest.update({ where: { email }, data: { verified: true } });
    return { message: 'Email verified successfully.' };
  }

  // ── Step 3: Create employee (OTP must be verified) ────────────────────────────
  async createEmployee(managerId: string, dto: {
    name: string;
    email: string;
    phone?: string;
    department: string;
    designation: string;
  }) {
    await this.assertManagerOrAdmin(managerId);

    if (!dto.email.endsWith('@gmail.com')) {
      throw new BadRequestException('Only Gmail addresses are allowed');
    }

    // Verify OTP was completed
    const otpRecord = await (this.prisma as any).otpRequest.findUnique({ where: { email: dto.email } });
    if (!otpRecord || !otpRecord.verified) {
      throw new BadRequestException('Email OTP verification is required before creating the employee account.');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const tempPassword = this.generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password_hash,
        phone: dto.phone,
        organization: dto.department,
        status: 'ACTIVE',
        emailVerified: true,
        onboarding_completed: false,
        metadata: {
          manager_id: managerId,
          department: dto.department,
          designation: dto.designation,
          must_change_password: true,
        },
      },
    });

    // Assign EMPLOYEE role
    let role = await this.prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });
    if (!role) {
      role = await this.prisma.role.create({ data: { name: 'EMPLOYEE' } });
    }
    await this.prisma.userRole.create({ data: { user_id: user.id, role_id: role.id } });

    // Create employee detail
    await this.prisma.employeeDetail.create({
      data: { user_id: user.id, department: dto.department, designation: dto.designation },
    });

    // Clean up OTP record safely
    try {
      await (this.prisma as any).otpRequest.delete({ where: { email: dto.email } });
    } catch { /* ignore if already deleted */ }

    // Send credentials email
    try {
      await this.mailService.sendEmployeeCredentials(dto.email, dto.name, tempPassword);
    } catch {
      // Don't fail if email fails — account is still created
    }

    return {
      message: `Employee account created. Login credentials sent to ${dto.email}`,
      employee: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: dto.department,
        designation: dto.designation,
        status: user.status,
      },
    };
  }

  async getMyEmployees(managerId: string) {
    await this.assertManagerOrAdmin(managerId);

    const employees = await this.prisma.user.findMany({
      where: { roles: { some: { role: { name: 'EMPLOYEE' } } } },
      include: {
        roles: { include: { role: true } },
        employee_detail: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Filter by manager_id from metadata
    return employees
      .filter(e => (e.metadata as any)?.manager_id === managerId)
      .map(e => this.mapEmployee(e));
  }

  async getAllEmployees(requesterId: string) {
    const roles = await this.assertManagerOrAdmin(requesterId);
    const isAdmin = roles.includes('ADMIN');

    const employees = await this.prisma.user.findMany({
      where: { roles: { some: { role: { name: 'EMPLOYEE' } } } },
      include: { roles: { include: { role: true } }, employee_detail: true },
      orderBy: { created_at: 'desc' },
    });

    // ADMIN sees all employees; MANAGER sees only employees they created
    const filtered = isAdmin
      ? employees
      : employees.filter(e => (e.metadata as any)?.manager_id === requesterId);

    return filtered.map(e => this.mapEmployee(e));
  }

  private mapEmployee(e: any) {
    return {
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone,
      status: e.status,
      department: e.employee_detail?.department || (e.metadata as any)?.department || '—',
      designation: e.employee_detail?.designation || (e.metadata as any)?.designation || '—',
      manager_id: (e.metadata as any)?.manager_id,
      must_change_password: (e.metadata as any)?.must_change_password || false,
      created_at: e.created_at,
    };
  }

  async updateEmployee(employeeId: string, managerId: string, dto: {
    name?: string;
    phone?: string;
    department?: string;
    designation?: string;
    status?: string;
  }) {
    const roles = await this.assertManagerOrAdmin(managerId);
    const isAdmin = roles.includes('ADMIN');

    const employee = await this.prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) throw new BadRequestException('Employee not found');

    // Manager can only update their own employees
    if (!isAdmin && (employee.metadata as any)?.manager_id !== managerId) {
      throw new ForbiddenException('You can only update employees you created');
    }

    await this.prisma.user.update({
      where: { id: employeeId },
      data: {
        name: dto.name,
        phone: dto.phone,
        status: dto.status,
        metadata: {
          ...(employee.metadata as any || {}),
          department: dto.department,
          designation: dto.designation,
        },
      },
    });

    if (dto.department || dto.designation) {
      await this.prisma.employeeDetail.upsert({
        where: { user_id: employeeId },
        create: { user_id: employeeId, department: dto.department || '', designation: dto.designation || '' },
        update: { department: dto.department, designation: dto.designation },
      });
    }

    return { message: 'Employee updated successfully' };
  }

  async deactivateEmployee(employeeId: string, managerId: string) {
    const roles = await this.assertManagerOrAdmin(managerId);
    const isAdmin = roles.includes('ADMIN');

    const employee = await this.prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) throw new BadRequestException('Employee not found');

    // Manager can only deactivate their own employees
    if (!isAdmin && (employee.metadata as any)?.manager_id !== managerId) {
      throw new ForbiddenException('You can only deactivate employees you created');
    }

    await this.prisma.user.update({ where: { id: employeeId }, data: { status: 'INACTIVE' } });
    return { message: 'Employee deactivated' };
  }

  getDepartments() {
    return DEPARTMENTS;
  }
}
