import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { BugsService } from './bugs.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('bugs')
export class BugsController {
  constructor(private readonly bugsService: BugsService) {}

  @Post() create(@Request() req: any, @Body() dto: any) { return this.bugsService.create(req.user.id, dto); }
  @Get() findAll(@Request() req: any, @Query() f: any) { return this.bugsService.findAll(req.user.id, f); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req: any) { return this.bugsService.findOne(id, req.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.bugsService.update(id, req.user.id, dto); }
  @Post(':id/comments') comment(@Param('id') id: string, @Request() req: any, @Body() b: any) { return this.bugsService.addComment(id, req.user.id, b.body); }
}
