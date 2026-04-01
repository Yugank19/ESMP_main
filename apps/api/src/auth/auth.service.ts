import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto } from '@esmp/shared';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailService: MailService,
    private auditService: AuditService,
  ) {}

  // ─── OTP: Send ───────────────────────────────────────────────────────────────
  async sendOtp(dto: SendOtpDto) {
    if (!dto.email.endsWith('@gmail.com')) {
      throw new BadRequestException('Only Gmail addresses are allowed');
    }

    // Check if email is already registered and verified
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser && existingUser.emailVerified) {
      throw new ConflictException('An account with this email already exists');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert OTP record (one per email)
    await (this.prisma as any).otpRequest.upsert({
      where: { email: dto.email },
      create: { email: dto.email, otp_code: otp, expires_at, verified: false },
      update: { otp_code: otp, expires_at, verified: false },
    });

    // Send OTP via SMTP
    await this.mailService.sendOtpEmail(dto.email, otp);

    return { message: 'OTP sent to your email. Valid for 10 minutes.' };
  }

  // ─── OTP: Verify ─────────────────────────────────────────────────────────────
  async verifyOtp(dto: VerifyOtpDto) {
    const record = await (this.prisma as any).otpRequest.findUnique({
      where: { email: dto.email },
    });

    if (!record) {
      throw new BadRequestException('No OTP found for this email. Please request a new one.');
    }

    if (new Date() > record.expires_at) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (record.otp_code !== dto.otp) {
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    // Mark as verified
    await (this.prisma as any).otpRequest.update({
      where: { email: dto.email },
      data: { verified: true },
    });

    return { message: 'OTP verified successfully. You can now complete registration.' };
  }

  // ─── Register ────────────────────────────────────────────────────────────────
  async register(dto: RegisterDto) {
    if (!dto.email.endsWith('@gmail.com')) {
      throw new BadRequestException('Only Gmail addresses are allowed');
    }

    // Ensure OTP was verified before allowing registration
    const otpRecord = await (this.prisma as any).otpRequest.findUnique({
      where: { email: dto.email },
    });

    if (!otpRecord || !otpRecord.verified) {
      throw new BadRequestException('Email OTP verification is required before registration.');
    }

    // Block self-registration as EMPLOYEE — employees are created by managers only
    const requestedRole = dto.role?.toUpperCase();
    if (requestedRole === 'EMPLOYEE') {
      throw new BadRequestException('Employees cannot self-register. Contact your manager to create your account.');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password_hash,
        phone: dto.phone,
        organization: dto.organization,
        avatar_url: dto.avatar_url,
        status: 'ACTIVE',
        emailVerified: true, // already verified via OTP
      },
    });

    // Assign role
    let role = await this.prisma.role.findUnique({
      where: { name: dto.role.toUpperCase() },
    });
    if (!role) {
      role = await this.prisma.role.create({
        data: { name: dto.role.toUpperCase() },
      });
    }

    await this.prisma.userRole.create({
      data: { user_id: user.id, role_id: role.id },
    });

    // Clean up OTP record
    await (this.prisma as any).otpRequest.delete({ where: { email: dto.email } });

    // Audit log
    await this.auditService.log(user.id, 'REGISTER', 'auth', user.id, { email: user.email, role: dto.role });

    return { message: 'Registration successful. You can now login.' };
  }

  // ─── Login ───────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Update last login
    await this.prisma.user.update({ where: { id: user.id }, data: { last_login: new Date() } });

    // Audit log
    await this.auditService.log(user.id, 'LOGIN', 'auth', user.id, { email: user.email });

    return {
      access_token: this.jwtService.sign({
        email: user.email,
        sub: user.id,
        roles: user.roles.map((ur) => ur.role.name),
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map((ur) => ur.role.name),
        onboarding_completed: user.onboarding_completed,
      },
    };
  }

  // ─── Legacy email-link verification (kept for backward compat) ───────────────
  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'VERIFY_EMAIL') {
        throw new BadRequestException('Invalid token type');
      }
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new BadRequestException('User not found');
      if (!user.emailVerified) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }
      return { message: 'Email verified successfully. You can now login.' };
    } catch {
      throw new BadRequestException('Invalid or expired verification link');
    }
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User with this email does not exist');
    if (user.emailVerified) throw new BadRequestException('Email is already verified');
    await this.sendVerificationLink(user.id, user.email);
    return { message: 'Verification email sent successfully' };
  }

  private async sendVerificationLink(userId: string, email: string) {
    const verificationToken = this.jwtService.sign(
      { sub: userId, email, type: 'VERIFY_EMAIL' },
      { expiresIn: '24h' },
    );
    const url = `http://localhost:3000/verify?token=${verificationToken}`;
    console.log(`VERIFICATION LINK FOR ${email}: ${url}`);
    await this.mailService.sendVerificationEmail(email, url);
  }
}
