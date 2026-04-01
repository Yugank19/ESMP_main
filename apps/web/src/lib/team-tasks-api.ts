import api from './api';

export const teamTasksApi = {
    // Tasks
    getTasks: (teamId: string, params?: Record<string, string>) =>
        api.get(`/teams/${teamId}/tasks`, { params }),
    getTask: (teamId: string, taskId: string) =>
        api.get(`/teams/${teamId}/tasks/${taskId}`),
    createTask: (teamId: string, data: any) =>
        api.post(`/teams/${teamId}/tasks`, data),
    updateTask: (teamId: string, taskId: string, data: any) =>
        api.patch(`/teams/${teamId}/tasks/${taskId}`, data),
    deleteTask: (teamId: string, taskId: string) =>
        api.delete(`/teams/${teamId}/tasks/${taskId}`),

    // Comments
    addComment: (teamId: string, taskId: string, body: string) =>
        api.post(`/teams/${teamId}/tasks/${taskId}/comments`, { body }),
    deleteComment: (teamId: string, taskId: string, commentId: string) =>
        api.delete(`/teams/${teamId}/tasks/${taskId}/comments/${commentId}`),

    // Milestones
    getMilestones: (teamId: string) =>
        api.get(`/teams/${teamId}/milestones`),
    createMilestone: (teamId: string, data: any) =>
        api.post(`/teams/${teamId}/milestones`, data),
    updateMilestone: (teamId: string, milestoneId: string, data: any) =>
        api.patch(`/teams/${teamId}/milestones/${milestoneId}`, data),
    deleteMilestone: (teamId: string, milestoneId: string) =>
        api.delete(`/teams/${teamId}/milestones/${milestoneId}`),

    // Progress
    getProgress: (teamId: string) =>
        api.get(`/teams/${teamId}/progress`),
    submitProgress: (teamId: string, data: any) =>
        api.post(`/teams/${teamId}/progress`, data),

    // Stats
    getStats: (teamId: string) =>
        api.get(`/teams/${teamId}/stats`),
};
