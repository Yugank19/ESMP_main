import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query,
    UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamFilesService } from './team-files.service';
import { CreateFolderDto, UpdateFileDto, AddFileCommentDto } from '@esmp/shared';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const uploadDir = join(process.cwd(), 'uploads', 'team-files');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

@ApiTags('team-files')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('teams/:teamId/files')
export class TeamFilesController {
    constructor(private readonly svc: TeamFilesService) {}

    // ── Folders ───────────────────────────────────────────────────────────────

    @Post('folders')
    createFolder(@Param('teamId') teamId: string, @Request() req: any, @Body() dto: CreateFolderDto) {
        return this.svc.createFolder(teamId, req.user.id, dto);
    }

    @Get('folders')
    getFolders(@Param('teamId') teamId: string, @Request() req: any, @Query('parent_id') parentId?: string) {
        return this.svc.getFolders(teamId, req.user.id, parentId);
    }

    @Delete('folders/:folderId')
    deleteFolder(@Param('teamId') teamId: string, @Param('folderId') folderId: string, @Request() req: any) {
        return this.svc.deleteFolder(folderId, req.user.id, teamId);
    }

    // ── Files ─────────────────────────────────────────────────────────────────

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: uploadDir,
            filename: (_, file, cb) => {
                const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, unique + extname(file.originalname));
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }))
    async uploadFile(
        @Param('teamId') teamId: string,
        @Request() req: any,
        @UploadedFile() file: Express.Multer.File,
        @Query('folder_id') folderId?: string,
    ) {
        const baseUrl = process.env.API_URL || 'http://localhost:4000';
        return this.svc.uploadFile(teamId, req.user.id, {
            name: file.originalname,
            original_name: file.originalname,
            file_url: `${baseUrl}/uploads/team-files/${file.filename}`,
            file_key: file.filename,
            mime_type: file.mimetype,
            size: file.size,
            folder_id: folderId,
        });
    }

    @Get()
    getFiles(
        @Param('teamId') teamId: string,
        @Request() req: any,
        @Query('folder_id') folderId?: string,
        @Query('search') search?: string,
    ) {
        return this.svc.getFiles(teamId, req.user.id, folderId, search);
    }

    @Get(':fileId')
    getFile(@Param('teamId') teamId: string, @Param('fileId') fileId: string, @Request() req: any) {
        return this.svc.getFile(fileId, req.user.id, teamId);
    }

    @Patch(':fileId')
    updateFile(@Param('teamId') teamId: string, @Param('fileId') fileId: string, @Request() req: any, @Body() dto: UpdateFileDto) {
        return this.svc.updateFile(fileId, req.user.id, teamId, dto);
    }

    @Delete(':fileId')
    deleteFile(@Param('teamId') teamId: string, @Param('fileId') fileId: string, @Request() req: any) {
        return this.svc.deleteFile(fileId, req.user.id, teamId);
    }

    @Post(':fileId/comments')
    addComment(@Param('teamId') teamId: string, @Param('fileId') fileId: string, @Request() req: any, @Body() dto: AddFileCommentDto) {
        return this.svc.addComment(fileId, req.user.id, teamId, dto);
    }
}
