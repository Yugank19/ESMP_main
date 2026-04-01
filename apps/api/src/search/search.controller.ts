import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Request() req: any,
    @Query('q') q: string,
    @Query('teamId') teamId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.globalSearch(req.user.id, q, {
      teamId, type, status, priority, from, to, sort,
      limit: limit ? parseInt(limit) : 10,
    });
  }
}
