const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const logTime = (dto: any) => fetch(`${API}/time-tracking`, { method: 'POST', headers: h(), body: JSON.stringify(dto) }).then(r => r.json());
export const getMyEntries = (from?: string, to?: string) => {
  const p = new URLSearchParams(); if (from) p.set('from', from); if (to) p.set('to', to);
  return fetch(`${API}/time-tracking?${p}`, { headers: h() }).then(r => r.json());
};
export const getWeeklySheet = () => fetch(`${API}/time-tracking/weekly`, { headers: h() }).then(r => r.json());
export const deleteTimeEntry = (id: string) => fetch(`${API}/time-tracking/${id}`, { method: 'DELETE', headers: h() }).then(r => r.json());
