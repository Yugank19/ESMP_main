import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { CompanyAnnouncementsService } from './announcements.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('company-announcements')
export class CompanyAnnouncementsController {
  constructor(private readonly svc: CompanyAnnouncementsService) {}

  @Post() create(@Request() req: any, @Body() dto: any) { return this.svc.create(req.user.id, dto); }
  @Get() findAll(@Request() req: any, @Query() f: any) { return this.svc.findAll(req.user.id, f); }
  @Patch(':id') update(@Param('id') id: string, @Request() req: any, @Body() dto: any) { return this.svc.update(id, req.user.id, dto); }
}
