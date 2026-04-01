import api from './api';

export const teamsApi = {
    getMyTeams: () => api.get('/teams'),
    getTeam: (id: string) => api.get(`/teams/${id}`),
    createTeam: (data: any) => api.post('/teams', data),
    updateTeam: (id: string, data: any) => api.patch(`/teams/${id}`, data),
    archiveTeam: (id: string) => api.patch(`/teams/${id}/archive`),
    deleteTeam: (id: string) => api.delete(`/teams/${id}`),
    inviteMember: (id: string, email: string) => api.post(`/teams/${id}/invite`, { email }),
    joinTeam: (invite_code: string) => api.post('/teams/join', { invite_code }),
    removeMember: (teamId: string, memberId: string) => api.delete(`/teams/${teamId}/members/${memberId}`),
    updateMemberRole: (teamId: string, memberId: string, role: string) =>
        api.patch(`/teams/${teamId}/members/${memberId}/role`, { role }),
    regenerateCode: (id: string) => api.post(`/teams/${id}/regenerate-code`),
};
