import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('team/:teamId')
  getEvents(
    @Param('teamId') teamId: string,
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.calendarService.getTeamEvents(teamId, req.user.id, from, to);
  }

  @Post('team/:teamId')
  createEvent(@Param('teamId') teamId: string, @Request() req: any, @Body() dto: any) {
    return this.calendarService.createEvent(teamId, req.user.id, dto);
  }

  @Patch(':eventId')
  updateEvent(@Param('eventId') eventId: string, @Request() req: any, @Body() dto: any) {
    return this.calendarService.updateEvent(eventId, req.user.id, dto);
  }

  @Delete(':eventId')
  deleteEvent(@Param('eventId') eventId: string, @Request() req: any) {
    return this.calendarService.deleteEvent(eventId, req.user.id);
  }
}
