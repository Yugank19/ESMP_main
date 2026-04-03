const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const getBugs = (filters = {}) => fetch(`${API}/bugs?${new URLSearchParams(filters as any)}`, { headers: h() }).then(r => r.json());
export const getBug = (id: string) => fetch(`${API}/bugs/${id}`, { headers: h() }).then(r => r.json());
export const createBug = (dto: any) => fetch(`${API}/bugs`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const updateBug = (id: string, dto: any) => fetch(`${API}/bugs/${id}`, { method: 'PATCH', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const addBugComment = (id: string, body: string) => fetch(`${API}/bugs/${id}/comments`, { method: 'POST', headers: h(), body: JSON.stringify({ body }) }).then(r => r.json());
export const deleteBug = (id: string) => fetch(`${API}/bugs/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json());
