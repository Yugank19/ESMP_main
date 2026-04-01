import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApprovalsService {
  constructor(private prisma: PrismaService) {}

  private async assertNotStudent(userId: string) {
    const roles = await this.prisma.userRole.findMany({ where: { user_id: userId }, include: { role: true } });
    if (roles.some(r => r.role.name.toUpperCase() === 'STUDENT')) throw new ForbiddenException('Company feature only');
    return roles.map(r => r.role.name.toUpperCase());
  }

  async createRequest(userId: string, dto: any) {
    await this.assertNotStudent(userId);

    // Find approvers: team leader → manager → admin
    const managers = await this.prisma.userRole.findMany({
      where: { role: { name: { in: ['MANAGER', 'ADMIN'] } } },
      include: { user: { select: { id: true, name: true } }, role: true },
      distinct: ['user_id'],
    });

    const steps = managers.slice(0, 2).map((m, i) => ({
      step_number: i + 1,
      approver_id: m.user_id,
      role_required: m.role.name,
      status: i === 0 ? 'PENDING' : 'PENDING',
    }));

    const request = await this.prisma.approvalRequest.create({
      data: {
        title: dto.title,
        type: dto.type,
        description: dto.description,
        requested_by: userId,
        total_steps: steps.length || 1,
        metadata: dto.metadata,
        steps: { create: steps },
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        steps: { include: { approver: { select: { id: true, name: true } } } },
      },
    });

    // Notify first approver
    if (steps.length > 0) {
      await this.prisma.notification.create({
        data: {
          user_id: steps[0].approver_id,
          type: 'APPROVAL_REQUESTED',
          payload: { request_id: request.id, title: request.title, type: request.type, from: userId },
        },
      });
    }
    return request;
  }

  async getMyRequests(userId: string) {
    await this.assertNotStudent(userId);
    return this.prisma.approvalRequest.findMany({
      where: { requested_by: userId },
      include: {
        steps: { include: { approver: { select: { id: true, name: true } } }, orderBy: { step_number: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getPendingForMe(userId: string) {
    await this.assertNotStudent(userId);
    return this.prisma.approvalStep.findMany({
      where: { approver_id: userId, status: 'PENDING' },
      include: {
        request: {
          include: { requester: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async act(stepId: string, userId: string, action: 'APPROVED' | 'REJECTED' | 'RETURNED', comment?: string) {
    await this.assertNotStudent(userId);
    const step = await this.prisma.approvalStep.findUnique({
      where: { id: stepId },
      include: { request: { include: { steps: { orderBy: { step_number: 'asc' } } } } },
    });
    if (!step) throw new NotFoundException('Step not found');
    if (step.approver_id !== userId) throw new ForbiddenException('Not your approval');
    if (step.status !== 'PENDING') throw new BadRequestException('Already acted on');

    await this.prisma.approvalStep.update({
      where: { id: stepId },
      data: { status: action, comment, acted_at: new Date() },
    });

    const request = step.request;
    if (action === 'APPROVED') {
      const nextStep = request.steps.find(s => s.step_number === step.step_number + 1);
      if (nextStep) {
        // Move to next step
        await this.prisma.approvalRequest.update({ where: { id: request.id }, data: { current_step: nextStep.step_number } });
        await this.prisma.notification.create({
          data: {
            user_id: nextStep.approver_id,
            type: 'APPROVAL_REQUESTED',
            payload: { request_id: request.id, title: request.title, type: request.type },
          },
        });
      } else {
        // All steps approved
        await this.prisma.approvalRequest.update({ where: { id: request.id }, data: { status: 'APPROVED' } });
        await this.prisma.notification.create({
          data: {
            user_id: request.requested_by,
            type: 'APPROVAL_APPROVED',
            payload: { request_id: request.id, title: request.title },
          },
        });
      }
    } else {
      const finalStatus = action === 'REJECTED' ? 'REJECTED' : 'RETURNED';
      await this.prisma.approvalRequest.update({ where: { id: request.id }, data: { status: finalStatus } });
      await this.prisma.notification.create({
        data: {
          user_id: request.requested_by,
          type: `APPROVAL_${finalStatus}`,
          payload: { request_id: request.id, title: request.title, comment },
        },
      });
    }

    return { message: `Request ${action.toLowerCase()}` };
  }

  async getRequest(id: string, userId: string) {
    await this.assertNotStudent(userId);
    const req = await this.prisma.approvalRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        steps: { include: { approver: { select: { id: true, name: true } } }, orderBy: { step_number: 'asc' } },
      },
    });
    if (!req) throw new NotFoundException('Request not found');
    return req;
  }
}
