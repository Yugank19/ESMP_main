const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function getAuditLogs(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API}/audit?${params}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}

export async function getTeamAuditLogs(teamId: string, filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API}/audit/team/${teamId}?${params}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch team audit logs');
  return res.json();
}

export async function getSystemLogs(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API}/audit/system?${params}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch system logs');
  return res.json();
}

export async function getActionTypes() {
  const res = await fetch(`${API}/audit/action-types`, { headers: headers() });
  if (!res.ok) return [];
  return res.json();
}

export async function callLogout() {
  await fetch(`${API}/auth/logout`, { method: 'POST', headers: headers() });
}
