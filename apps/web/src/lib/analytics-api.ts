const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function getGlobalAnalytics() {
  const res = await fetch(`${API}/analytics/global`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function getTeamAnalytics(teamId: string) {
  const res = await fetch(`${API}/analytics/team/${teamId}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch team analytics');
  return res.json();
}
