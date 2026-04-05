const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const startTask = (taskId: string) =>
  fetch(`${API}/team-tasks/${taskId}/start`, { method: 'POST', headers: h() }).then(r => r.json());

export const submitForReview = (taskId: string, dto: { description: string; files?: any[] }) =>
  fetch(`${API}/team-tasks/${taskId}/submit`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());

export const sendToTesting = (taskId: string, feedback?: string) =>
  fetch(`${API}/team-tasks/${taskId}/send-to-testing`, { method: 'POST', headers: h(), body: JSON.stringify({ feedback }) }).then(r => r.json());

export const passTesting = (taskId: string, feedback?: string) =>
  fetch(`${API}/team-tasks/${taskId}/pass-testing`, { method: 'POST', headers: h(), body: JSON.stringify({ feedback }) }).then(r => r.json());

export const failTesting = (taskId: string, feedback: string) =>
  fetch(`${API}/team-tasks/${taskId}/fail-testing`, { method: 'POST', headers: h(), body: JSON.stringify({ feedback }) }).then(r => r.json());

export const approveTask = (taskId: string, feedback?: string) =>
  fetch(`${API}/team-tasks/${taskId}/approve`, { method: 'POST', headers: h(), body: JSON.stringify({ feedback }) }).then(r => r.json());

export const rejectTask = (taskId: string, feedback: string) =>
  fetch(`${API}/team-tasks/${taskId}/reject`, { method: 'POST', headers: h(), body: JSON.stringify({ feedback }) }).then(r => r.json());

export const getTaskWorkflow = (taskId: string) =>
  fetch(`${API}/team-tasks/${taskId}/workflow`, { headers: h() }).then(r => r.json());
