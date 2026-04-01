import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from '@esmp/shared';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        project_id: dto.project_id,
        assignee_id: dto.assignee_id,
        priority: dto.priority || 'MEDIUM',
        status: 'TODO',
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        created_by: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.task.findMany({
      include: { project: true, assignee: true },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignee: true,
        comments: true,
        files: true,
        creator: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.task.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  async createApproval(taskId: string, approverId: string, comments?: string) {
    return this.prisma.approval.create({
      data: {
        target_type: 'TASK',
        target_id: taskId,
        approver_id: approverId,
        status: 'PENDING',
        comments,
      },
    });
  }

  async respondToApproval(
    approvalId: string,
    status: 'APPROVED' | 'REJECTED',
    comments?: string,
  ) {
    return this.prisma.approval.update({
      where: { id: approvalId },
      data: {
        status,
        comments,
        responded_at: new Date(),
      },
    });
  }
}
