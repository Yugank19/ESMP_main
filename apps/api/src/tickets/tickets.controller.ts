import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: any) {
    return this.ticketsService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query() filters: any) {
    return this.ticketsService.findAll(req.user.id, filters);
  }

  @Get('stats')
  getStats(@Request() req: any) {
    return this.ticketsService.getStats(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.ticketsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.ticketsService.update(id, req.user.id, dto);
  }

  @Post(':id/comments')
  addComment(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.ticketsService.addComment(id, req.user.id, body.body, body.is_internal);
  }

  @Delete(':id')
  deleteTicket(@Param('id') id: string, @Request() req: any) {
    return this.ticketsService.deleteTicket(id, req.user.id);
  }
}
