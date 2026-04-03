const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const getArticles = (filters = {}) => fetch(`${API}/knowledge-base?${new URLSearchParams(filters as any)}`, { headers: h() }).then(r => r.json());
export const getArticle = (id: string) => fetch(`${API}/knowledge-base/${id}`, { headers: h() }).then(r => r.json());
export const getCategories = () => fetch(`${API}/knowledge-base/categories`, { headers: h() }).then(r => r.json());
export const createArticle = (dto: any) => fetch(`${API}/knowledge-base`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const updateArticle = (id: string, dto: any) => fetch(`${API}/knowledge-base/${id}`, { method: 'PATCH', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const deleteArticle = (id: string) => fetch(`${API}/knowledge-base/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json());
