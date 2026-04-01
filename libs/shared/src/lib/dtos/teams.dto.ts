import { IsString, IsNotEmpty, IsOptional, IsIn, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    description?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    project_name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    purpose?: string;

    @IsString()
    @IsIn(['PUBLIC', 'PRIVATE'])
    @IsOptional()
    @ApiProperty({ enum: ['PUBLIC', 'PRIVATE'], default: 'PRIVATE' })
    visibility?: string;
}

export class UpdateTeamDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    description?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    project_name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    purpose?: string;

    @IsString()
    @IsIn(['PUBLIC', 'PRIVATE'])
    @IsOptional()
    @ApiProperty({ required: false })
    visibility?: string;
}

export class InviteMemberDto {
    @IsEmail()
    @IsOptional()
    @ApiProperty({ required: false })
    email?: string;
}

export class UpdateMemberRoleDto {
    @IsString()
    @IsIn(['MEMBER', 'REVIEWER', 'VIEWER'])
    @ApiProperty({ enum: ['MEMBER', 'REVIEWER', 'VIEWER'] })
    role: string;
}

export class JoinTeamDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    invite_code: string;
}
