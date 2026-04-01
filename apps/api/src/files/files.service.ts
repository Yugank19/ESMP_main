import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    file: Express.Multer.File,
    description?: string,
    taskId?: string,
    projectId?: string,
  ) {
    // In a real app, you'd upload to S3 here. For now, we simulate and store metadata.
    const s3_key = `uploads/${Date.now()}-${file.originalname}`;

    return this.prisma.file.create({
      data: {
        owner_id: userId,
        task_id: taskId,
        project_id: projectId,
        filename: file.originalname,
        s3_key: s3_key,
        mime_type: file.mimetype,
        size: file.size,
        version: 1, // Logic for version tracking would go here
      },
    });
  }

  async findByTask(taskId: string) {
    return this.prisma.file.findMany({ where: { task_id: taskId } });
  }

  async findByProject(projectId: string) {
    return this.prisma.file.findMany({ where: { project_id: projectId } });
  }

  async findOne(id: string) {
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }
}
