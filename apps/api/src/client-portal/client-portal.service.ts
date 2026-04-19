import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ClientPortalService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private async assertManagerOrAdmin(userId: string) {
    const roles = await this.prisma.userRole.findMany({ where: { user_id: userId }, include: { role: true } });
    const names = roles.map(r => r.role.name.toUpperCase());
    if (!names.some(r => ['MANAGER', 'ADMIN'].includes(r))) throw new ForbiddenException('Managers only');
    return names;
  }

  private async assertClient(userId: string) {
    const roles = await this.prisma.userRole.findMany({ where: { user_id: userId }, include: { role: true } });
    if (!roles.some(r => r.role.name.toUpperCase() === 'CLIENT')) throw new ForbiddenException('Client access only');
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    return pwd;
  }

  // ── Manager: Create client account ───────────────────────────────────────────
  async createClient(managerId: string, dto: {
    name: string; email: string; company_name: string; phone?: string;
    project_name: string; description?: string; access_type?: string;
  }) {
    await this.assertManagerOrAdmin(managerId);
    if (!dto.email.endsWith('@gmail.com')) throw new BadRequestException('Only Gmail addresses allowed');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const tempPassword = this.generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email, name: dto.name, password_hash,
        phone: dto.phone, organization: dto.company_name,
        status: 'ACTIVE', emailVerified: true,
        metadata: { manager_id: managerId, company_name: dto.company_name, must_change_password: true },
      },
    });

    let role = await this.prisma.role.findUnique({ where: { name: 'CLIENT' } });
    if (!role) role = await this.prisma.role.create({ data: { name: 'CLIENT' } });
    await this.prisma.userRole.create({ data: { user_id: user.id, role_id: role.id } });

    const project = await this.prisma.clientProject.create({
      data: {
        client_id: user.id, manager_id: managerId,
        project_name: dto.project_name, company_name: dto.company_name,
        description: dto.description, access_type: dto.access_type || 'VIEW',
      },
    });

    try { await this.mailService.sendClientCredentials(dto.email, dto.name, tempPassword, dto.project_name); } catch {}

    return { message: `Client account created. Credentials sent to ${dto.email}`, client: { id: user.id, name: user.name, email: user.email }, project };
  }

  // ── Manager: Get all clients ──────────────────────────────────────────────────
  async getMyClients(managerId: string) {
    await this.assertManagerOrAdmin(managerId);
    const projects = await this.prisma.clientProject.findMany({
      where: { manager_id: managerId },
      include: {
        client: { select: { id: true, name: true, email: true, status: true, last_login: true } },
        deliverables: { select: { id: true, status: true } },
        milestones: { select: { id: true, status: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return projects;
  }

  // ── Manager: Update client project ───────────────────────────────────────────
  async updateClientProject(projectId: string, managerId: string, dto: any) {
    await this.assertManagerOrAdmin(managerId);
    const project = await this.prisma.clientProject.findUnique({ where: { id: projectId } });
    if (!project || project.manager_id !== managerId) throw new ForbiddenException('Not authorized');
    return this.prisma.clientProject.update({ where: { id: projectId }, data: dto });
  }

  // ── Manager: Add deliverable ──────────────────────────────────────────────────
  async addDeliverable(projectId: string, managerId: string, dto: any) {
    await this.assertManagerOrAdmin(managerId);
    const project = await this.prisma.clientProject.findUnique({ where: { id: projectId } });
    if (!project || project.manager_id !== managerId) throw new ForbiddenException('Not authorized');

    const deliverable = await this.prisma.clientDeliverable.create({
      data: { project_id: projectId, uploaded_by: managerId, ...dto },
      include: { uploader: { select: { id: true, name: true } } },
    });

    // Notify client
    await this.prisma.notification.create({
      data: {
        user_id: project.client_id, type: 'DELIVERABLE_READY',
        payload: { project_id: projectId, deliverable_id: deliverable.id, title: dto.title, message: `New deliverable ready for review: "${dto.title}"` },
      },
    });
    return deliverable;
  }

  // ── Manager: Add milestone ────────────────────────────────────────────────────
  async addMilestone(projectId: string, managerId: string, dto: any) {
    await this.assertManagerOrAdmin(managerId);
    const project = await this.prisma.clientProject.findUnique({ where: { id: projectId } });
    if (!project || project.manager_id !== managerId) throw new ForbiddenException('Not authorized');
    return this.prisma.clientMilestone.create({ data: { project_id: projectId, ...dto } });
  }

  // ── Client: Get dashboard data ────────────────────────────────────────────────
  async getClientDashboard(clientId: string) {
    await this.assertClient(clientId);
    const projects = await this.prisma.clientProject.findMany({
      where: { client_id: clientId, is_active: true },
      include: {
        deliverables: { orderBy: { created_at: 'desc' } },
        milestones: { orderBy: { due_date: 'asc' } },
        feedback: { include: { author: { select: { id: true, name: true, avatar_url: true } } }, orderBy: { created_at: 'desc' }, take: 10 },
        manager: { select: { id: true, name: true, email: true, avatar_url: true } },
      },
    });

    const totalDeliverables = projects.flatMap(p => p.deliverables).length;
    const pendingReviews = projects.flatMap(p => p.deliverables).filter(d => d.status === 'PENDING_REVIEW').length;
    const completedMilestones = projects.flatMap(p => p.milestones).filter(m => m.status === 'COMPLETED').length;
    const totalMilestones = projects.flatMap(p => p.milestones).length;

    return { projects, stats: { totalProjects: projects.length, pendingReviews, completedMilestones, totalMilestones, totalDeliverables } };
  }

  // ── Client: Get single project ────────────────────────────────────────────────
  async getClientProject(projectId: string, clientId: string) {
    await this.assertClient(clientId);
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      include: {
        deliverables: { orderBy: { created_at: 'desc' } },
        milestones: { orderBy: { due_date: 'asc' } },
        feedback: { include: { author: { select: { id: true, name: true, avatar_url: true } } }, orderBy: { created_at: 'desc' } },
        manager: { select: { id: true, name: true, email: true, avatar_url: true } },
      },
    });
    if (!project || project.client_id !== clientId) throw new ForbiddenException('Access denied');
    return project;
  }

  // ── Client: Approve deliverable ───────────────────────────────────────────────
  async approveDeliverable(deliverableId: string, clientId: string, feedback?: string) {
    await this.assertClient(clientId);
    const d = await this.prisma.clientDeliverable.findUnique({ where: { id: deliverableId }, include: { project: true } });
    if (!d || d.project.client_id !== clientId) throw new ForbiddenException('Access denied');

    await this.prisma.clientDeliverable.update({ where: { id: deliverableId }, data: { status: 'APPROVED', feedback } });
    await this.prisma.clientFeedback.create({ data: { project_id: d.project_id, author_id: clientId, body: feedback || 'Approved', type: 'APPROVAL' } });
    await this.prisma.notification.create({
      data: { user_id: d.project.manager_id, type: 'DELIVERABLE_APPROVED', payload: { deliverable_id: deliverableId, title: d.title, message: `Client approved "${d.title}"` } },
    });
    return { message: 'Deliverable approved' };
  }

  // ── Client: Reject deliverable ────────────────────────────────────────────────
  async rejectDeliverable(deliverableId: string, clientId: string, feedback: string) {
    await this.assertClient(clientId);
    const d = await this.prisma.clientDeliverable.findUnique({ where: { id: deliverableId }, include: { project: true } });
    if (!d || d.project.client_id !== clientId) throw new ForbiddenException('Access denied');
    if (!feedback?.trim()) throw new BadRequestException('Feedback required when rejecting');

    await this.prisma.clientDeliverable.update({ where: { id: deliverableId }, data: { status: 'REVISION_REQUESTED', feedback } });
    await this.prisma.clientFeedback.create({ data: { project_id: d.project_id, author_id: clientId, body: feedback, type: 'REJECTION' } });
    await this.prisma.notification.create({
      data: { user_id: d.project.manager_id, type: 'DELIVERABLE_REJECTED', payload: { deliverable_id: deliverableId, title: d.title, message: `Client requested revision on "${d.title}": ${feedback}` } },
    });
    return { message: 'Revision requested' };
  }

  // ── Client: Add feedback/comment ─────────────────────────────────────────────
  async addFeedback(projectId: string, clientId: string, body: string, type = 'COMMENT') {
    await this.assertClient(clientId);
    const project = await this.prisma.clientProject.findUnique({ where: { id: projectId } });
    if (!project || project.client_id !== clientId) throw new ForbiddenException('Access denied');
    if (!['COMMENT', 'CHANGE_REQUEST'].includes(type)) throw new BadRequestException('Invalid feedback type');

    const fb = await this.prisma.clientFeedback.create({
      data: { project_id: projectId, author_id: clientId, body, type },
      include: { author: { select: { id: true, name: true, avatar_url: true } } },
    });
    await this.prisma.notification.create({
      data: { user_id: project.manager_id, type: 'CLIENT_FEEDBACK', payload: { project_id: projectId, message: `Client feedback: ${body.slice(0, 80)}` } },
    });
    return fb;
  }

  // ── Client: Get notifications ─────────────────────────────────────────────────
  async getClientNotifications(clientId: string) {
    await this.assertClient(clientId);
    return this.prisma.notification.findMany({
      where: { user_id: clientId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async markNotificationRead(notifId: string, clientId: string) {
    await this.assertClient(clientId);
    return this.prisma.notification.updateMany({
      where: { id: notifId, user_id: clientId },
      data: { read: true },
    });
  }

  async markAllNotificationsRead(clientId: string) {
    await this.assertClient(clientId);
    return this.prisma.notification.updateMany({
      where: { user_id: clientId, read: false },
      data: { read: true },
    });
  }

  // ── Client: Get project activity feed ────────────────────────────────────────
  async getProjectActivity(projectId: string, clientId: string) {
    await this.assertClient(clientId);
    const project = await this.prisma.clientProject.findUnique({ where: { id: projectId } });
    if (!project || project.client_id !== clientId) throw new ForbiddenException('Access denied');

    const [deliverables, milestones, feedback] = await Promise.all([
      this.prisma.clientDeliverable.findMany({
        where: { project_id: projectId },
        include: { uploader: { select: { id: true, name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' }, take: 20,
      }),
      this.prisma.clientMilestone.findMany({
        where: { project_id: projectId },
        orderBy: { created_at: 'desc' }, take: 20,
      }),
      this.prisma.clientFeedback.findMany({
        where: { project_id: projectId },
        include: { author: { select: { id: true, name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' }, take: 20,
      }),
    ]);

    const activity = [
      ...deliverables.map(d => ({ type: 'DELIVERABLE', action: `Deliverable "${d.title}" submitted`, actor: d.uploader, date: d.created_at, status: d.status, id: d.id })),
      ...milestones.map(m => ({ type: 'MILESTONE', action: `Milestone "${m.title}" — ${m.status}`, actor: null, date: m.created_at, status: m.status, id: m.id })),
      ...feedback.map(f => ({ type: 'FEEDBACK', action: f.type === 'CHANGE_REQUEST' ? `Change request: ${f.body.slice(0, 60)}` : `Comment: ${f.body.slice(0, 60)}`, actor: f.author, date: f.created_at, status: f.type, id: f.id })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);

    return activity;
  }

  // ── Client: Get project report ────────────────────────────────────────────────
  async getProjectReport(projectId: string, clientId: string) {
    await this.assertClient(clientId);
    const project = await this.prisma.clientProject.findUnique({
      where: { id: projectId },
      include: {
        deliverables: true,
        milestones: true,
        feedback: { include: { author: { select: { id: true, name: true } } } },
        manager: { select: { id: true, name: true, email: true } },
      },
    });
    if (!project || project.client_id !== clientId) throw new ForbiddenException('Access denied');

    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length;
    const totalDeliverables = project.deliverables.length;
    const approvedDeliverables = project.deliverables.filter(d => d.status === 'APPROVED').length;
    const pendingDeliverables = project.deliverables.filter(d => d.status === 'PENDING_REVIEW').length;
    const changeRequests = project.feedback.filter(f => f.type === 'CHANGE_REQUEST').length;
    const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    return {
      project: { id: project.id, name: project.project_name, company: project.company_name, status: project.status, description: project.description, manager: project.manager, created_at: project.created_at },
      summary: { totalMilestones, completedMilestones, progressPct, totalDeliverables, approvedDeliverables, pendingDeliverables, changeRequests },
      milestones: project.milestones,
      deliverables: project.deliverables,
      recentFeedback: project.feedback.slice(0, 10),
    };
  }

  // ── Client: Update profile ────────────────────────────────────────────────────
  async updateClientProfile(clientId: string, dto: { name?: string; phone?: string; organization?: string; bio?: string }) {
    await this.assertClient(clientId);
    return this.prisma.user.update({
      where: { id: clientId },
      data: dto,
      select: { id: true, name: true, email: true, phone: true, organization: true, bio: true, avatar_url: true },
    });
  }

  // ── Manager: Update milestone status ─────────────────────────────────────────
  async updateMilestone(milestoneId: string, managerId: string, dto: any) {
    await this.assertManagerOrAdmin(managerId);
    const milestone = await this.prisma.clientMilestone.findUnique({ where: { id: milestoneId }, include: { project: true } });
    if (!milestone || milestone.project.manager_id !== managerId) throw new ForbiddenException('Not authorized');
    return this.prisma.clientMilestone.update({ where: { id: milestoneId }, data: dto });
  }

  // ── Manager: Delete deliverable ───────────────────────────────────────────────
  async deleteDeliverable(deliverableId: string, managerId: string) {
    await this.assertManagerOrAdmin(managerId);
    const d = await this.prisma.clientDeliverable.findUnique({ where: { id: deliverableId }, include: { project: true } });
    if (!d || d.project.manager_id !== managerId) throw new ForbiddenException('Not authorized');
    return this.prisma.clientDeliverable.delete({ where: { id: deliverableId } });
  }
}
