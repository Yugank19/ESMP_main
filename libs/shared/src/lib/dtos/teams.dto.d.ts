export declare class CreateTeamDto {
    name: string;
    description?: string;
    project_name?: string;
    purpose?: string;
    visibility?: string;
}
export declare class UpdateTeamDto {
    name?: string;
    description?: string;
    project_name?: string;
    purpose?: string;
    visibility?: string;
}
export declare class InviteMemberDto {
    email?: string;
}
export declare class UpdateMemberRoleDto {
    role: string;
}
export declare class JoinTeamDto {
    invite_code: string;
}
