import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto, UpdateFileDto, AddFileCommentDto } from '@esmp/shared';

@Injectable()
export class TeamFilesService {
    constructor(private prisma: PrismaService) {}

    private async assertMember(teamId: string, userId: string) {
        const m = await this.prisma.teamMember.findFirst({
            where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
        });
        if (!m) throw new ForbiddenException('Not a team member');
        return m;
    }

    private async assertLeader(teamId: string, userId: string) {
        const m = await this.assertMember(teamId, userId);
        if (m.role !== 'LEADER') throw new ForbiddenException('Leader only');
        return m;
    }

    // ── Folders ───────────────────────────────────────────────────────────────

    async createFolder(teamId: string, userId: string, dto: CreateFolderDto) {
        await this.assertMember(teamId, userId);
        return this.prisma.teamFolder.create({
            data: { team_id: teamId, name: dto.name, parent_id: dto.parent_id, created_by: userId },
        });
    }

    async getFolders(teamId: string, userId: string, parentId?: string) {
        await this.assertMember(teamId, userId);
        const parentFilter = (parentId && parentId !== 'root') ? parentId : null;
        return this.prisma.teamFolder.findMany({
            where: { team_id: teamId, parent_id: parentFilter },
            include: { _count: { select: { files: true, children: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async deleteFolder(folderId: string, userId: string, teamId: string) {
        const folder = await this.prisma.teamFolder.findUnique({ where: { id: folderId } });
        if (!folder || folder.team_id !== teamId) throw new NotFoundException('Folder not found');
        const member = await this.prisma.teamMember.findFirst({
            where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
        });
        if (!member) throw new ForbiddenException('Not a team member');
        if (folder.created_by !== userId && member.role !== 'LEADER') {
            throw new ForbiddenException('Only the creator or leader can delete this folder');
        }
        return this.prisma.teamFolder.delete({ where: { id: folderId } });
    }

    // ── Files ─────────────────────────────────────────────────────────────────

    async uploadFile(teamId: string, userId: string, fileData: {
        name: string; original_name: string; file_url: string;
        file_key: string; mime_type: string; size: number; folder_id?: string;
    }) {
        await this.assertMember(teamId, userId);
        const file = await this.prisma.teamFile.create({
            data: {
                team_id: teamId,
                uploaded_by: userId,
                folder_id: fileData.folder_id || null,
                name: fileData.name,
                original_name: fileData.original_name,
                file_url: fileData.file_url,
                file_key: fileData.file_key,
                mime_type: fileData.mime_type,
                size: fileData.size,
            },
            include: { uploader: { select: { id: true, name: true } } },
        });
        await this.logActivity(teamId, userId, 'FILE_UPLOADED', `Uploaded file: ${fileData.original_name}`);
        return file;
    }

    async getFiles(teamId: string, userId: string, folderId?: string, search?: string) {
        await this.assertMember(teamId, userId);
        // folderId='root' or undefined = root level (folder_id IS NULL)
        // folderId=<uuid> = inside that folder
        const folderFilter = (folderId && folderId !== 'root')
            ? { folder_id: folderId }
            : { folder_id: null };

        return this.prisma.teamFile.findMany({
            where: {
                team_id: teamId,
                ...folderFilter,
                ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
            },
            include: {
                uploader: { select: { id: true, name: true } },
                _count: { select: { comments: true, versions: true } },
            },
            orderBy: [{ is_important: 'desc' }, { created_at: 'desc' }],
        });
    }

    async getFile(fileId: string, userId: string, teamId: string) {
        await this.assertMember(teamId, userId);
        const file = await this.prisma.teamFile.findUnique({
            where: { id: fileId },
            include: {
                uploader: { select: { id: true, name: true } },
                comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { created_at: 'asc' } },
                versions: { include: { uploader: { select: { id: true, name: true } } }, orderBy: { version: 'desc' } },
            },
        });
        if (!file || file.team_id !== teamId) throw new NotFoundException('File not found');
        return file;
    }

    async updateFile(fileId: string, userId: string, teamId: string, dto: UpdateFileDto) {
        await this.assertMember(teamId, userId);
        const file = await this.prisma.teamFile.findUnique({ where: { id: fileId } });
        if (!file || file.team_id !== teamId) throw new NotFoundException('File not found');
        const member = await this.prisma.teamMember.findFirst({
            where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
        });
        if (file.uploaded_by !== userId && member?.role !== 'LEADER') {
            throw new ForbiddenException('Cannot edit this file');
        }
        return this.prisma.teamFile.update({ where: { id: fileId }, data: dto });
    }

    async deleteFile(fileId: string, userId: string, teamId: string) {
        const file = await this.prisma.teamFile.findUnique({ where: { id: fileId } });
        if (!file || file.team_id !== teamId) throw new NotFoundException('File not found');
        const member = await this.prisma.teamMember.findFirst({
            where: { team_id: teamId, user_id: userId, status: 'ACTIVE' },
        });
        if (file.uploaded_by !== userId && member?.role !== 'LEADER') {
            throw new ForbiddenException('Cannot delete this file');
        }
        return this.prisma.teamFile.delete({ where: { id: fileId } });
    }

    async addComment(fileId: string, userId: string, teamId: string, dto: AddFileCommentDto) {
        await this.assertMember(teamId, userId);
        return this.prisma.teamFileComment.create({
            data: { file_id: fileId, user_id: userId, body: dto.body },
            include: { user: { select: { id: true, name: true } } },
        });
    }

    private async logActivity(teamId: string, userId: string, action: string, description: string) {
        await this.prisma.teamActivity.create({
            data: { team_id: teamId, user_id: userId, action, description },
        }).catch(() => {});
    }
}
