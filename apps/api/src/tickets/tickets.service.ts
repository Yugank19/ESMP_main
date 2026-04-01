import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EMPLOYEE_ROLES = ['EMPLOYEE', 'MANAGER', 'ADMIN', 'CLIENT'];

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  private async assertEmployeeRole(userId: string) {
    const roles = await this.prisma.userRole.findMany({ where: { user_id: userId }, include: { role: true } });
    const names = roles.map(r => r.role.name.toUpperCase());
    if (names.includes('STUDENT')) throw new ForbiddenException('This feature is for company employees only');
    if (!names.some(n => EMPLOYEE_ROLES.includes(n))) throw new ForbiddenException('Access denied');
    return names;
  }

  private async nextTicketNo(): Promise<string> {
    const count = await this.prisma.ticket.count();
    return `TKT-${String(count + 1).padStart(4, '0')}`;
  }

  async create(userId: string, dto: any) {
    await this.assertEmployeeRole(userId);
    const ticket_no = await this.nextTicketNo();
    const ticket = await this.prisma.ticket.create({
      data: {
        ticket_no,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority || 'MEDIUM',
        department: dto.department,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        created_by: userId,
      },
      include: { creator: { select: { id: true, name: true, email: true } }, assignee: { select: { id: true, name: true } } },
    });

    // Notify admins/managers
    const managers = await this.prisma.userRole.findMany({
      where: { role: { name: { in: ['MANAGER', 'ADMIN'] } } },
      select: { user_id: true },
    });
    if (managers.length) {
      await this.prisma.notification.createMany({
        data: managers.map(m => ({
          user_id: m.user_id,
          type: 'TICKET_CREATED',
          payload: { ticket_id: ticket.id, ticket_no, title: ticket.title, category: ticket.category },
        })),
        skipDuplicates: true,
      });
    }
    return ticket;
  }

  async findAll(userId: string, filters: any = {}) {
    const roles = await this.assertEmployeeRole(userId);
    const isPrivileged = roles.some(r => ['MANAGER', 'ADMIN'].includes(r));

    const where: any = {};
    if (!isPrivileged) where.created_by = userId; // employees see only their own
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigned_to) where.assigned_to = filters.assigned_to;

    return this.prisma.ticket.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const roles = await this.assertEmployeeRole(userId);
    const isPrivileged = roles.some(r => ['MANAGER', 'ADMIN'].includes(r));
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        comments: { include: { user: { select: { id: true, name: true, avatar_url: true } } }, orderBy: { created_at: 'asc' } },
        history: { include: { user: { select: { id: true, name: true } } }, orderBy: { created_at: 'desc' } },
        attachments: { include: { uploader: { select: { id: true, name: true } } } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isPrivileged && ticket.created_by !== userId && ticket.assigned_to !== userId)
      throw new ForbiddenException('Access denied');
    return ticket;
  }

  async update(id: string, userId: string, dto: any) {
    const roles = await this.assertEmployeeRole(userId);
    const isPrivileged = roles.some(r => ['MANAGER', 'ADMIN'].includes(r));
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isPrivileged && ticket.created_by !== userId) throw new ForbiddenException('Access denied');

    const history: any[] = [];
    const trackFields = ['status', 'priority', 'assigned_to', 'category'];
    for (const f of trackFields) {
      if (dto[f] !== undefined && dto[f] !== (ticket as any)[f]) {
        history.push({ ticket_id: id, user_id: userId, field: f, old_value: String((ticket as any)[f] ?? ''), new_value: String(dto[f]) });
      }
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority,
        status: dto.status,
        department: dto.department,
        assigned_to: isPrivileged ? dto.assigned_to : undefined,
        due_date: dto.due_date ? new Date(dto.due_date) : undefined,
        resolved_at: dto.status === 'RESOLVED' ? new Date() : undefined,
        closed_at: dto.status === 'CLOSED' ? new Date() : undefined,
      },
      include: { creator: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } },
    });

    if (history.length) await this.prisma.ticketHistory.createMany({ data: history });

    // Notify assignee if changed
    if (dto.assigned_to && dto.assigned_to !== ticket.assigned_to) {
      await this.prisma.notification.create({
        data: {
          user_id: dto.assigned_to,
          type: 'TICKET_ASSIGNED',
          payload: { ticket_id: id, ticket_no: ticket.ticket_no, title: ticket.title },
        },
      });
    }
    return updated;
  }

  async addComment(ticketId: string, userId: string, body: string, is_internal = false) {
    await this.assertEmployeeRole(userId);
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.prisma.ticketComment.create({
      data: { ticket_id: ticketId, user_id: userId, body, is_internal },
      include: { user: { select: { id: true, name: true, avatar_url: true } } },
    });
  }

  async getStats(userId: string) {
    const roles = await this.assertEmployeeRole(userId);
    const isPrivileged = roles.some(r => ['MANAGER', 'ADMIN'].includes(r));
    const where = isPrivileged ? {} : { created_by: userId };

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } }),
      this.prisma.ticket.count({ where: { ...where, status: 'CLOSED' } }),
    ]);
    return { total, open, inProgress, resolved, closed };
  }
}
