const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const getAnnouncements = (filters = {}) => fetch(`${API}/company-announcements?${new URLSearchParams(filters as any)}`, { headers: h() }).then(r => r.json());
export const createAnnouncement = (dto: any) => fetch(`${API}/company-announcements`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const updateAnnouncement = (id: string, dto: any) => fetch(`${API}/company-announcements/${id}`, { method: 'PATCH', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
