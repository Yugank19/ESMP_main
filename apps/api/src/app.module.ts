import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { MailModule } from './mail/mail.module';
import { ProfileModule } from './profile/profile.module';
import { FilesModule } from './files/files.module';
import { ChatModule } from './chat/chat.module';
import { AdminModule } from './admin/admin.module';
import { TeamsModule } from './teams/teams.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeamTasksModule } from './team-tasks/team-tasks.module';
import { TeamChatModule } from './team-chat/team-chat.module';
import { TeamFilesModule } from './team-files/team-files.module';
import { TeamCollabModule } from './team-collab/team-collab.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { CalendarModule } from './calendar/calendar.module';
import { SearchModule } from './search/search.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { TicketsModule } from './tickets/tickets.module';
import { ApprovalsModule } from './approvals-workflow/approvals.module';
import { TimeTrackingModule } from './time-tracking/time-tracking.module';
import { BugsModule } from './bugs/bugs.module';
import { KbModule } from './knowledge-base/kb.module';
import { CompanyAnnouncementsModule } from './company-announcements/announcements.module';
import { WorkloadModule } from './workload/workload.module';
import { EmployeesModule } from './employees/employees.module';
import { ClientPortalModule } from './client-portal/client-portal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    MailModule,
    ProfileModule,
    FilesModule,
    ChatModule,
    AdminModule,
    TeamsModule,
    NotificationsModule,
    TeamTasksModule,
    TeamChatModule,
    TeamFilesModule,
    TeamCollabModule,
    AnalyticsModule,
    ReportsModule,
    CalendarModule,
    SearchModule,
    SettingsModule,
    AuditModule,
    TicketsModule,
    ApprovalsModule,
    TimeTrackingModule,
    BugsModule,
    KbModule,
    CompanyAnnouncementsModule,
    WorkloadModule,
    EmployeesModule,
    ClientPortalModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
