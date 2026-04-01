const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

function headers() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
}

export interface SearchOptions {
  teamId?: string;
  type?: string;
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
  sort?: string;
  limit?: number;
}

export async function globalSearch(query: string, options: SearchOptions = {}) {
  const params = new URLSearchParams({ q: query });
  if (options.teamId) params.set('teamId', options.teamId);
  if (options.type) params.set('type', options.type);
  if (options.status) params.set('status', options.status);
  if (options.priority) params.set('priority', options.priority);
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (options.sort) params.set('sort', options.sort);
  if (options.limit) params.set('limit', String(options.limit));

  const res = await fetch(`${API}/search?${params}`, { headers: headers() });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}
