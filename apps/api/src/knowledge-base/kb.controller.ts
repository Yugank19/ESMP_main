import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { KbService } from './kb.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('knowledge-base')
export class KbController {
  constructor(private readonly kbService: KbService) {}

  @Post() create(@Request() req: any, @Body() dto: any) { return this.kbService.create(req.user.id, dto); }
  @Get() findAll(@Request() req: any, @Query() f: any) { return this.kbService.findAll(req.user.id, f); }
  @Get('categories') getCategories(@Request() req: any) { return this.kbService.getCategories(req.user.id); }
  @Get(':id') findOne(@Param('id') id: string, @Request() req: any) { return this.kbService.findOne(id, req.user.id); }
  @Patch(':id') update(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.kbService.update(id, req.user.id, dto); }
  @Delete(':id') deleteArticle(@Param('id') id: string, @Request() req: any) { return this.kbService.deleteArticle(id, req.user.id); }
}
