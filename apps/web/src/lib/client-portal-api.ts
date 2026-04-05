const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

// Manager
export const createClient = (dto: any) => fetch(`${API}/client-portal/clients`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const getMyClients = () => fetch(`${API}/client-portal/clients`, { headers: h() }).then(r => r.json());
export const updateClientProject = (id: string, dto: any) => fetch(`${API}/client-portal/projects/${id}`, { method: 'PATCH', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const addDeliverable = (projectId: string, dto: any) => fetch(`${API}/client-portal/projects/${projectId}/deliverables`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const addMilestone = (projectId: string, dto: any) => fetch(`${API}/client-portal/projects/${projectId}/milestones`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());

// Client
export const getClientDashboard = () => fetch(`${API}/client-portal/dashboard`, { headers: h() }).then(r => r.json());
export const getClientProject = (id: string) => fetch(`${API}/client-portal/projects/${id}`, { headers: h() }).then(r => r.json());
export const approveDeliverable = (id: string, feedback?: string) => fetch(`${API}/client-portal/deliverables/${id}/approve`, { method: 'POST', headers: h(), body: JSON.stringify({ feedback }) }).then(r => r.json());
export const rejectDeliverable = (id: string, feedback: string) => fetch(`${API}/client-portal/deliverables/${id}/reject`, { method: 'POST', headers: h(), body: JSON.stringify({ feedback }) }).then(r => r.json());
export const addFeedback = (projectId: string, body: string, type = 'COMMENT') => fetch(`${API}/client-portal/projects/${projectId}/feedback`, { method: 'POST', headers: h(), body: JSON.stringify({ body, type }) }).then(r => r.json());
