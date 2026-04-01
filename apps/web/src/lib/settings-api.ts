const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function getUserPreferences() {
  const res = await fetch(`${API}/settings/preferences`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch preferences');
  return res.json();
}

export async function updateUserPreferences(dto: any) {
  const res = await fetch(`${API}/settings/preferences`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return res.json();
}

export async function getTeamSettings(teamId: string) {
  const res = await fetch(`${API}/settings/team/${teamId}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch team settings');
  return res.json();
}

export async function updateTeamSettings(teamId: string, settings: Record<string, string>) {
  const res = await fetch(`${API}/settings/team/${teamId}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update team settings');
  return res.json();
}
