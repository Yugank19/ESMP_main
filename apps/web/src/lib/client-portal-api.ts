const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

async function req(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, { ...opts, headers: { ...h(), ...(opts.headers || {}) } });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}

// ── Manager ───────────────────────────────────────────────────────────────────
export const createClient = (dto: any) => req('/client-portal/clients', { method: 'POST', body: JSON.stringify(dto) });
export const getMyClients = () => req('/client-portal/clients');
export const updateClientProject = (id: string, dto: any) => req(`/client-portal/projects/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
export const addDeliverable = (projectId: string, dto: any) => req(`/client-portal/projects/${projectId}/deliverables`, { method: 'POST', body: JSON.stringify(dto) });
export const deleteDeliverable = (id: string) => req(`/client-portal/deliverables/${id}`, { method: 'DELETE' });
export const addMilestone = (projectId: string, dto: any) => req(`/client-portal/projects/${projectId}/milestones`, { method: 'POST', body: JSON.stringify(dto) });
export const updateMilestone = (id: string, dto: any) => req(`/client-portal/milestones/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });

// ── Client ────────────────────────────────────────────────────────────────────
export const getClientDashboard = () => req('/client-portal/dashboard');
export const getClientProject = (id: string) => req(`/client-portal/projects/${id}`);
export const getProjectActivity = (id: string) => req(`/client-portal/projects/${id}/activity`);
export const getProjectReport = (id: string) => req(`/client-portal/projects/${id}/report`);
export const approveDeliverable = (id: string, feedback?: string) => req(`/client-portal/deliverables/${id}/approve`, { method: 'POST', body: JSON.stringify({ feedback }) });
export const rejectDeliverable = (id: string, feedback: string) => req(`/client-portal/deliverables/${id}/reject`, { method: 'POST', body: JSON.stringify({ feedback }) });
export const addFeedback = (projectId: string, body: string, type = 'COMMENT') => req(`/client-portal/projects/${projectId}/feedback`, { method: 'POST', body: JSON.stringify({ body, type }) });
export const getClientNotifications = () => req('/client-portal/notifications');
export const markNotificationRead = (id: string) => req(`/client-portal/notifications/${id}/read`, { method: 'PATCH' });
export const markAllNotificationsRead = () => req('/client-portal/notifications/read-all', { method: 'PATCH' });
export const updateClientProfile = (dto: any) => req('/client-portal/profile', { method: 'PATCH', body: JSON.stringify(dto) });
