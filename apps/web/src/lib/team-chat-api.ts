import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const teamChatApi = {
    getMessages: (teamId: string, cursor?: string, limit = 50) =>
        axios.get(`${API}/teams/${teamId}/chat/messages`, {
            headers: getHeaders(),
            params: { cursor, limit },
        }),

    sendMessage: (teamId: string, data: { body: string; type?: string; file_url?: string; file_name?: string; file_size?: number }) =>
        axios.post(`${API}/teams/${teamId}/chat/messages`, data, { headers: getHeaders() }),

    editMessage: (teamId: string, messageId: string, body: string) =>
        axios.patch(`${API}/teams/${teamId}/chat/messages/${messageId}`, { body }, { headers: getHeaders() }),

    deleteMessage: (teamId: string, messageId: string) =>
        axios.delete(`${API}/teams/${teamId}/chat/messages/${messageId}`, { headers: getHeaders() }),

    pinMessage: (teamId: string, messageId: string) =>
        axios.post(`${API}/teams/${teamId}/chat/messages/${messageId}/pin`, {}, { headers: getHeaders() }),

    unpinMessage: (teamId: string, messageId: string) =>
        axios.delete(`${API}/teams/${teamId}/chat/messages/${messageId}/pin`, { headers: getHeaders() }),

    getPinned: (teamId: string) =>
        axios.get(`${API}/teams/${teamId}/chat/pinned`, { headers: getHeaders() }),

    markRead: (teamId: string, messageId: string) =>
        axios.post(`${API}/teams/${teamId}/chat/messages/${messageId}/read`, {}, { headers: getHeaders() }),

    search: (teamId: string, q: string) =>
        axios.get(`${API}/teams/${teamId}/chat/search`, { headers: getHeaders(), params: { q } }),
};
