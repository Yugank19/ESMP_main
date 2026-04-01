import { Module } from '@nestjs/common';
import { CompanyAnnouncementsController } from './announcements.controller';
import { CompanyAnnouncementsService } from './announcements.service';

@Module({ controllers: [CompanyAnnouncementsController], providers: [CompanyAnnouncementsService], exports: [CompanyAnnouncementsService] })
export class CompanyAnnouncementsModule {}
