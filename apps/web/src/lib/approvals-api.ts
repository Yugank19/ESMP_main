const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const createApproval = (dto: any) => fetch(`${API}/approvals`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const getMyRequests = () => fetch(`${API}/approvals/my-requests`, { headers: h() }).then(r => r.json());
export const getPendingForMe = () => fetch(`${API}/approvals/pending-for-me`, { headers: h() }).then(r => r.json());
export const getApproval = (id: string) => fetch(`${API}/approvals/${id}`, { headers: h() }).then(r => r.json());
export const actOnStep = (stepId: string, action: string, comment?: string) =>
  fetch(`${API}/approvals/steps/${stepId}/act`, { method: 'POST', headers: h(), body: JSON.stringify({ action, comment }) }).then(r => r.json());
