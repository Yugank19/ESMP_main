import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    password?: string;

    @IsOptional()
    @ApiProperty({ required: false })
    metadata?: Record<string, any>;
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    name?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    status?: string;

    @IsOptional()
    @ApiProperty({ required: false })
    metadata?: Record<string, any>;
}

export class UserResponseDto {
    id: string;
    email: string;
    name: string;
    status: string;
    created_at: Date;
}

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    })
    password: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Student, Employee, Manager, Client' })
    role: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    organization?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    avatar_url?: string;
}

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    password: string;
}

export class SendOtpDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    email: string;
}

export class VerifyOtpDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    otp: string;
}

export class CompleteProfileDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    address?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    dob?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    bio?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    emergency_contact?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    skills?: string;

    @IsOptional()
    @ApiProperty({ required: false })
    interests?: string;
}

export class StudentDetailDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    college_name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    course_branch: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    year_semester: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    skills?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    internship_interest?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    portfolio_url?: string;
}

export class EmployeeDetailDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    department: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    designation: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    skills?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    experience_level?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    current_team?: string;
}

export class ManagerDetailDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    department: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    team_handled?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    authority_level?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    projects_handled?: string;
}

export class ClientDetailDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    company_name: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    contact_person: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty()
    phone: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    project_requirement?: string;
}
