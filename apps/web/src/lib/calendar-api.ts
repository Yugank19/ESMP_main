const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export async function getTeamEvents(teamId: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await fetch(`${API}/calendar/team/${teamId}?${params}`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function createEvent(teamId: string, dto: any) {
  const res = await fetch(`${API}/calendar/team/${teamId}`, {
    method: 'POST', headers: headers(), body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
}

export async function updateEvent(eventId: string, dto: any) {
  const res = await fetch(`${API}/calendar/${eventId}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to update event');
  return res.json();
}

export async function deleteEvent(eventId: string) {
  const res = await fetch(`${API}/calendar/${eventId}`, { method: 'DELETE', headers: headers() });
  if (!res.ok) throw new Error('Failed to delete event');
  return res.json();
}
