import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
} from '@nestjs/swagger';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file related to a task or project' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        description: { type: 'string' },
        taskId: { type: 'string' },
        projectId: { type: 'string' },
      },
    },
  })
  async uploadFile(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('description') description?: string,
    @Body('taskId') taskId?: string,
    @Body('projectId') projectId?: string,
  ) {
    return this.filesService.create(
      req.user.id,
      file,
      description,
      taskId,
      projectId,
    );
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get all files for a specific task' })
  async getTaskFiles(@Param('taskId') taskId: string) {
    return this.filesService.findByTask(taskId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all files for a specific project' })
  async getProjectFiles(@Param('projectId') projectId: string) {
    return this.filesService.findByProject(projectId);
  }
}
