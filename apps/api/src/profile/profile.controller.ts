import {
  Controller, Post, Patch, Body, UseGuards, Request, Get, Put, BadRequestException,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CompleteProfileDto, StudentDetailDto, EmployeeDetailDto, ManagerDetailDto, ClientDetailDto,
} from '@esmp/shared';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

@UseGuards(AuthGuard('jwt'))
@Controller('profile')
export class ProfileController {
  constructor(
    private profileService: ProfileService,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  @Get()
  async getProfile(@Request() req: any) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch()
  async updateProfile(@Request() req: any, @Body() body: any) {
    const allowed = ['name', 'bio', 'phone', 'address', 'avatar_url'];
    const data: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const updated = await this.prisma.user.update({ where: { id: req.user.id }, data });
    await this.auditService.log(req.user.id, 'PROFILE_UPDATED', 'user', req.user.id, { fields: Object.keys(data) });
    return updated;
  }

  @Patch('password')
  async changePassword(@Request() req: any, @Body() body: { current_password: string; new_password: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.password_hash) throw new BadRequestException('No password set');
    const valid = await bcrypt.compare(body.current_password, user.password_hash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    if (body.new_password.length < 8) throw new BadRequestException('Password must be at least 8 characters');
    const hash = await bcrypt.hash(body.new_password, 10);
    await this.prisma.user.update({ where: { id: req.user.id }, data: { password_hash: hash } });
    await this.auditService.log(req.user.id, 'PASSWORD_CHANGED', 'user', req.user.id);
    return { message: 'Password updated successfully' };
  }

  @Put('complete')
  async completeProfile(@Request() req: any, @Body() dto: CompleteProfileDto) {
    return this.profileService.completeProfile(req.user.id, dto);
  }

  @Post('student')
  async updateStudent(@Request() req: any, @Body() dto: StudentDetailDto) {
    return this.profileService.updateStudentDetails(req.user.id, dto);
  }

  @Post('employee')
  async updateEmployee(@Request() req: any, @Body() dto: EmployeeDetailDto) {
    return this.profileService.updateEmployeeDetails(req.user.id, dto);
  }

  @Post('manager')
  async updateManager(@Request() req: any, @Body() dto: ManagerDetailDto) {
    return this.profileService.updateManagerDetails(req.user.id, dto);
  }

  @Post('client')
  async updateClient(@Request() req: any, @Body() dto: ClientDetailDto) {
    return this.profileService.updateClientDetails(req.user.id, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: require('multer').memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req: any, file: any, cb: any) => {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new BadRequestException('Only image files allowed'), false);
      }
      cb(null, true);
    },
  }))
  async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `avatar-${req.user.id}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    // URL accessible via ServeStatic: /uploads/avatars/filename
    const avatar_url = `/uploads/avatars/${filename}`;
    await this.prisma.user.update({ where: { id: req.user.id }, data: { avatar_url } });

    return { avatar_url };
  }
}
