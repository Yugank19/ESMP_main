import { IsString, IsOptional, IsBoolean, IsDateString, IsEnum } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsDateString()
  start_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  all_day?: boolean;

  @IsOptional()
  @IsString()
  color?: string;
}

export class GenerateReportDto {
  @IsString()
  report_type: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  filters?: Record<string, any>;
}

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  notifications_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  email_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  desktop_notifications?: boolean;

  @IsOptional()
  @IsString()
  timezone?: string;
}
