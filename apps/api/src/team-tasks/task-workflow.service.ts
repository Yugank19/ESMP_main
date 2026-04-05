import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Full enterprise task lifecycle
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'READY_FOR_TESTING', 'APPROVED', 'DONE', 'REWORK_REQUIRED', 'CANCELLED'] as const;

@Injectable()
export class TaskWorkflowService {
  constructor(private prisma: PrismaService) {}

  private async getTaskAndAssertMember(taskId: string, userId: string) {
    const task = await this.prisma.teamTask.findUnique({
      where: { id: taskId },
      include: {
        assignees: { include: { user: { select: { id: true, name: true, email: true } } } },
        creator: { select: { id: true, name: true } },
        team: { include: { members: { where: { status: 'ACTIVE' }, include: { user: { select: { id: true, name: true, email: true } } } } } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    const member = task.team.members.find(m => m.user_id === userId);
    if (!member) throw new ForbiddenException('Not a team member');
    return { task, member };
  }

  private async notifyStakeholders(task: any, type: string, message: string, excludeUserId?: string) {
    const userIds = new Set<string>();
    userIds.add(task.created_by);
    task.assignees?.forEach((a: any) => userIds.add(a.user_id));
    // Also notify leader
    task.team?.members?.filter((m: any) => m.role === 'LEADER').forEach((m: any) => userIds.add(m.user_id));
    if (excludeUserId) userIds.delete(excludeUserId);

    if (userIds.size > 0) {
      await this.prisma.notification.createMany({
        data: Array.from(userIds).map(uid => ({
          user_id: uid,
          type,
          payload: { task_id: task.id, task_title: task.title, team_id: task.team_id, message },
        })),
        skipDuplicates: true,
      });
    }
  }

  private async logHistory(taskId: string, userId: string, field: string, oldValue: string, newValue: string) {
    await this.prisma.teamTaskHistory.create({
      data: { task_id: taskId, user_id: userId, field, old_value: oldValue, new_value: newValue },
    });
  }

  // ── Employee: Start working on task ──────────────────────────────────────────
  async startTask(taskId: string, userId: string) {
    const { task, member } = await this.getTaskAndAssertMember(taskId, userId);
    const isAssignee = task.assignees.some((a: any) => a.user_id === userId);
    if (!isAssignee) throw new ForbiddenException('Only assigned members can start this task');
    if (task.status !== 'TODO' && task.status !== 'REWORK_REQUIRED')
      throw new BadRequestException(`Cannot start task with status: ${task.status}`);

    const updated = await this.prisma.teamTask.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' },
    });

    await this.logHistory(taskId, userId, 'status', task.status, 'IN_PROGRESS');
    await this.notifyStakeholders(task, 'TASK_STARTED', `Task "${task.title}" is now In Progress`, userId);
    await this.prisma.teamActivity.create({
      data: { team_id: task.team_id, user_id: userId, action: 'TASK_STARTED', description: `Started working on "${task.title}"` },
    });

    return updated;
  }

  // ── Employee: Submit work for review ─────────────────────────────────────────
  async submitForReview(taskId: string, userId: string, dto: { description: string; files?: any[] }) {
    const { task } = await this.getTaskAndAssertMember(taskId, userId);
    const isAssignee = task.assignees.some((a: any) => a.user_id === userId);
    if (!isAssignee) throw new ForbiddenException('Only assigned members can submit this task');
    if (task.status !== 'IN_PROGRESS' && task.status !== 'REWORK_REQUIRED')
      throw new BadRequestException(`Cannot submit task with status: ${task.status}`);

    // Count existing submissions for version number
    const submissionCount = await this.prisma.taskSubmission.count({ where: { task_id: taskId } });

    const [submission] = await Promise.all([
      this.prisma.taskSubmission.create({
        data: {
          task_id: taskId,
          submitted_by: userId,
          description: dto.description,
          files: dto.files || [],
          version: submissionCount + 1,
        },
        include: { submitter: { select: { id: true, name: true } } },
      }),
      this.prisma.teamTask.update({ where: { id: taskId }, data: { status: 'READY_FOR_REVIEW' } }),
      this.logHistory(taskId, userId, 'status', task.status, 'READY_FOR_REVIEW'),
    ]);

    await this.notifyStakeholders(task, 'TASK_SUBMITTED', `"${task.title}" submitted for review by ${task.assignees.find((a: any) => a.user_id === userId)?.user?.name}`, userId);
    await this.prisma.teamActivity.create({
      data: { team_id: task.team_id, user_id: userId, action: 'TASK_SUBMITTED', description: `Submitted "${task.title}" for review (v${submissionCount + 1})` },
    });

    return submission;
  }

  // ── Leader/Manager: Send to testing ──────────────────────────────────────────
  async sendToTesting(taskId: string, userId: string, feedback?: string) {
    const { task, member } = await this.getTaskAndAssertMember(taskId, userId);
    if (!['LEADER', 'REVIEWER'].includes(member.role)) throw new ForbiddenException('Only leaders/reviewers can send to testing');
    if (task.status !== 'READY_FOR_REVIEW') throw new BadRequestException('Task must be in READY_FOR_REVIEW status');

    await Promise.all([
      this.prisma.teamTask.update({ where: { id: taskId }, data: { status: 'READY_FOR_TESTING' } }),
      this.prisma.taskReview.create({ data: { task_id: taskId, reviewer_id: userId, action: 'SENT_FOR_TESTING', feedback } }),
      this.logHistory(taskId, userId, 'status', 'READY_FOR_REVIEW', 'READY_FOR_TESTING'),
    ]);

    await this.notifyStakeholders(task, 'TASK_SENT_FOR_TESTING', `"${task.title}" sent to QA/Testing`);
    return { message: 'Task sent for testing' };
  }

  // ── Tester: Pass testing ──────────────────────────────────────────────────────
  async passTesting(taskId: string, userId: string, feedback?: string) {
    const { task, member } = await this.getTaskAndAssertMember(taskId, userId);
    if (!['LEADER', 'REVIEWER', 'MEMBER'].includes(member.role)) throw new ForbiddenException('Not authorized');
    if (task.status !== 'READY_FOR_TESTING') throw new BadRequestException('Task must be in READY_FOR_TESTING status');

    await Promise.all([
      this.prisma.teamTask.update({ where: { id: taskId }, data: { status: 'READY_FOR_REVIEW' } }),
      this.prisma.taskReview.create({ data: { task_id: taskId, reviewer_id: userId, action: 'APPROVED', feedback: feedback || 'Testing passed' } }),
      this.logHistory(taskId, userId, 'status', 'READY_FOR_TESTING', 'READY_FOR_REVIEW'),
    ]);

    await this.notifyStakeholders(task, 'TASK_TESTING_PASSED', `"${task.title}" passed testing — ready for manager review`);
    return { message: 'Testing passed, moved to review' };
  }

  // ── Tester: Fail testing — send back to developer ────────────────────────────
  async failTesting(taskId: string, userId: string, feedback: string) {
    const { task, member } = await this.getTaskAndAssertMember(taskId, userId);
    if (!['LEADER', 'REVIEWER', 'MEMBER'].includes(member.role)) throw new ForbiddenException('Not authorized');
    if (task.status !== 'READY_FOR_TESTING') throw new BadRequestException('Task must be in READY_FOR_TESTING status');

    await Promise.all([
      this.prisma.teamTask.update({ where: { id: taskId }, data: { status: 'REWORK_REQUIRED' } }),
      this.prisma.taskReview.create({ data: { task_id: taskId, reviewer_id: userId, action: 'REWORK_REQUIRED', feedback } }),
      this.logHistory(taskId, userId, 'status', 'READY_FOR_TESTING', 'REWORK_REQUIRED'),
    ]);

    await this.notifyStakeholders(task, 'TASK_TESTING_FAILED', `"${task.title}" failed testing — rework required: ${feedback}`);
    return { message: 'Task sent back for rework' };
  }

  // ── Manager/Leader: Approve task ─────────────────────────────────────────────
  async approveTask(taskId: string, userId: string, feedback?: string) {
    const { task, member } = await this.getTaskAndAssertMember(taskId, userId);
    if (!['LEADER'].includes(member.role)) throw new ForbiddenException('Only team leaders can approve tasks');
    if (!['READY_FOR_REVIEW', 'APPROVED'].includes(task.status))
      throw new BadRequestException('Task must be in READY_FOR_REVIEW status to approve');

    await Promise.all([
      this.prisma.teamTask.update({ where: { id: taskId }, data: { status: 'DONE' } }),
      this.prisma.taskReview.create({ data: { task_id: taskId, reviewer_id: userId, action: 'APPROVED', feedback } }),
      this.logHistory(taskId, userId, 'status', task.status, 'DONE'),
    ]);

    await this.notifyStakeholders(task, 'TASK_APPROVED', `"${task.title}" has been approved and marked as Done!`);
    await this.prisma.teamActivity.create({
      data: { team_id: task.team_id, user_id: userId, action: 'TASK_APPROVED', description: `Approved "${task.title}"` },
    });

    return { message: 'Task approved and marked as Done' };
  }

  // ── Manager/Leader: Reject task ───────────────────────────────────────────────
  async rejectTask(taskId: string, userId: string, feedback: string) {
    const { task, member } = await this.getTaskAndAssertMember(taskId, userId);
    if (!['LEADER'].includes(member.role)) throw new ForbiddenException('Only team leaders can reject tasks');
    if (task.status !== 'READY_FOR_REVIEW') throw new BadRequestException('Task must be in READY_FOR_REVIEW status');
    if (!feedback?.trim()) throw new BadRequestException('Feedback is required when rejecting');

    await Promise.all([
      this.prisma.teamTask.update({ where: { id: taskId }, data: { status: 'REWORK_REQUIRED' } }),
      this.prisma.taskReview.create({ data: { task_id: taskId, reviewer_id: userId, action: 'REJECTED', feedback } }),
      this.logHistory(taskId, userId, 'status', 'READY_FOR_REVIEW', 'REWORK_REQUIRED'),
    ]);

    await this.notifyStakeholders(task, 'TASK_REJECTED', `"${task.title}" was rejected — rework required: ${feedback}`);
    await this.prisma.teamActivity.create({
      data: { team_id: task.team_id, user_id: userId, action: 'TASK_REJECTED', description: `Rejected "${task.title}": ${feedback}` },
    });

    return { message: 'Task rejected, sent back for rework' };
  }

  // ── Get task with full workflow data ─────────────────────────────────────────
  async getTaskWorkflow(taskId: string, userId: string) {
    const { task } = await this.getTaskAndAssertMember(taskId, userId);

    const [submissions, reviews, history] = await Promise.all([
      this.prisma.taskSubmission.findMany({
        where: { task_id: taskId },
        include: { submitter: { select: { id: true, name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.taskReview.findMany({
        where: { task_id: taskId },
        include: { reviewer: { select: { id: true, name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.teamTaskHistory.findMany({
        where: { task_id: taskId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return { submissions, reviews, history };
  }
}
