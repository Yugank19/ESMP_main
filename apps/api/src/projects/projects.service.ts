import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from '@esmp/shared';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        owner_id: userId,
        client_id: dto.client_id,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
        status: 'PLANNING',
        metadata: {
          deliverables: dto.deliverables,
          priority: dto.priority,
          team_members: dto.team_members,
        },
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        owner: true,
        tasks: {
          include: { assignee: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: {
          include: { assignee: true, comments: true, files: true },
        },
        owner: true,
        files: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        start_date: updateProjectDto.start_date
          ? new Date(updateProjectDto.start_date)
          : undefined,
        end_date: updateProjectDto.end_date
          ? new Date(updateProjectDto.end_date)
          : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
