import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuditService } from '../audit/audit.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('preferences')
  getPreferences(@Request() req: any) {
    return this.settingsService.getUserPreferences(req.user.id);
  }

  @Patch('preferences')
  async updatePreferences(@Request() req: any, @Body() dto: any) {
    const result = await this.settingsService.updateUserPreferences(req.user.id, dto);
    await this.auditService.log(req.user.id, 'SETTINGS_CHANGED', 'user_preferences', req.user.id, { changed: Object.keys(dto) });
    return result;
  }

  @Get('team/:teamId')
  getTeamSettings(@Param('teamId') teamId: string, @Request() req: any) {
    return this.settingsService.getTeamSettings(teamId, req.user.id);
  }

  @Patch('team/:teamId')
  async updateTeamSettings(@Param('teamId') teamId: string, @Request() req: any, @Body() dto: any) {
    const result = await this.settingsService.updateTeamSettings(teamId, req.user.id, dto);
    await this.auditService.log(req.user.id, 'SETTINGS_CHANGED', 'team_settings', teamId, { changed: Object.keys(dto) });
    return result;
  }
}
