import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const teamCollabApi = {
    // Announcements
    createAnnouncement: (teamId: string, data: { title: string; body: string; is_pinned?: boolean }) =>
        axios.post(`${API}/teams/${teamId}/announcements`, data, { headers: getHeaders() }),

    getAnnouncements: (teamId: string) =>
        axios.get(`${API}/teams/${teamId}/announcements`, { headers: getHeaders() }),

    updateAnnouncement: (teamId: string, annId: string, data: any) =>
        axios.patch(`${API}/teams/${teamId}/announcements/${annId}`, data, { headers: getHeaders() }),

    deleteAnnouncement: (teamId: string, annId: string) =>
        axios.delete(`${API}/teams/${teamId}/announcements/${annId}`, { headers: getHeaders() }),

    // Meeting Notes
    createMeeting: (teamId: string, data: any) =>
        axios.post(`${API}/teams/${teamId}/meetings`, data, { headers: getHeaders() }),

    getMeetings: (teamId: string) =>
        axios.get(`${API}/teams/${teamId}/meetings`, { headers: getHeaders() }),

    getMeeting: (teamId: string, noteId: string) =>
        axios.get(`${API}/teams/${teamId}/meetings/${noteId}`, { headers: getHeaders() }),

    updateMeeting: (teamId: string, noteId: string, data: any) =>
        axios.patch(`${API}/teams/${teamId}/meetings/${noteId}`, data, { headers: getHeaders() }),

    deleteMeeting: (teamId: string, noteId: string) =>
        axios.delete(`${API}/teams/${teamId}/meetings/${noteId}`, { headers: getHeaders() }),

    // Activity
    getActivity: (teamId: string) =>
        axios.get(`${API}/teams/${teamId}/activity`, { headers: getHeaders() }),
};
