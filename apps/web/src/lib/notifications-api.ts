import api from './api';

export const notificationsApi = {
    getAll: () => api.get('/notifications'),
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/read-all'),
    acceptInvite: (inviteId: string) => api.post(`/teams/invites/${inviteId}/accept`),
    declineInvite: (inviteId: string) => api.post(`/teams/invites/${inviteId}/decline`),
};
