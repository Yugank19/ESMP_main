import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getUserPreferences(userId: string) {
    let prefs = await this.prisma.userPreference.findUnique({ where: { user_id: userId } });
    if (!prefs) {
      prefs = await this.prisma.userPreference.create({ data: { user_id: userId } });
    }
    return prefs;
  }

  async updateUserPreferences(userId: string, dto: any) {
    return this.prisma.userPreference.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...dto },
      update: dto,
    });
  }

  async getTeamSettings(teamId: string, userId: string) {
    const m = await this.prisma.teamMember.findFirst({ where: { team_id: teamId, user_id: userId, status: 'ACTIVE' } });
    if (!m) throw new ForbiddenException('Not a team member');

    const settings = await this.prisma.teamSetting.findMany({ where: { team_id: teamId } });
    const map: Record<string, string> = {};
    settings.forEach(s => { map[s.key] = s.value; });
    return map;
  }

  async updateTeamSettings(teamId: string, userId: string, settings: Record<string, string>) {
    const m = await this.prisma.teamMember.findFirst({ where: { team_id: teamId, user_id: userId, status: 'ACTIVE' } });
    if (!m || m.role !== 'LEADER') throw new ForbiddenException('Only team leaders can update settings');

    const ops = Object.entries(settings).map(([key, value]) =>
      this.prisma.teamSetting.upsert({
        where: { team_id_key: { team_id: teamId, key } },
        create: { team_id: teamId, key, value },
        update: { value },
      }),
    );

    await Promise.all(ops);
    return this.getTeamSettings(teamId, userId);
  }
}
