const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const getTickets = (filters = {}) => fetch(`${API}/tickets?${new URLSearchParams(filters as any)}`, { headers: h() }).then(r => r.json());
export const getTicketStats = () => fetch(`${API}/tickets/stats`, { headers: h() }).then(r => r.json());
export const getTicket = (id: string) => fetch(`${API}/tickets/${id}`, { headers: h() }).then(r => r.json());
export const createTicket = (dto: any) => fetch(`${API}/tickets`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const updateTicket = (id: string, dto: any) => fetch(`${API}/tickets/${id}`, { method: 'PATCH', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const addTicketComment = (id: string, body: string, is_internal = false) => fetch(`${API}/tickets/${id}/comments`, { method: 'POST', headers: h(), body: JSON.stringify({ body, is_internal }) }).then(r => r.json());
export const deleteTicket = (id: string) => fetch(`${API}/tickets/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json());
