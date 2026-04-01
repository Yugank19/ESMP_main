export declare class CreateUserDto {
    email: string;
    name: string;
    password?: string;
    metadata?: Record<string, any>;
}
export declare class UpdateUserDto {
    name?: string;
    status?: string;
    metadata?: Record<string, any>;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    name: string;
    status: string;
    created_at: Date;
}
export declare class RegisterDto {
    email: string;
    name: string;
    password: string;
    phone: string;
    role: string;
    organization?: string;
    avatar_url?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class SendOtpDto {
    email: string;
}
export declare class VerifyOtpDto {
    email: string;
    otp: string;
}
export declare class CompleteProfileDto {
    address?: string;
    dob?: string;
    bio?: string;
    emergency_contact?: string;
    skills?: string;
    interests?: string;
}
export declare class StudentDetailDto {
    college_name: string;
    course_branch: string;
    year_semester: string;
    skills?: string;
    internship_interest?: string;
    portfolio_url?: string;
}
export declare class EmployeeDetailDto {
    department: string;
    designation: string;
    skills?: string;
    experience_level?: string;
    current_team?: string;
}
export declare class ManagerDetailDto {
    department: string;
    team_handled?: string;
    authority_level?: string;
    projects_handled?: string;
}
export declare class ClientDetailDto {
    company_name: string;
    contact_person: string;
    phone: string;
    project_requirement?: string;
}
