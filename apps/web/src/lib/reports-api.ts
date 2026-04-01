const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function generateReport(teamId: string, dto: any) {
  const res = await fetch(`${API}/reports/team/${teamId}/generate`, {
    method: 'POST', headers: headers(), body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}

export async function getTeamReports(teamId: string) {
  const res = await fetch(`${API}/reports/team/${teamId}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}

export async function getReport(reportId: string) {
  const res = await fetch(`${API}/reports/${reportId}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}
