const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` });

export const getMyWorkload = () => fetch(`${API}/workload/me`, { headers: h() }).then(r => r.json());
export const getTeamWorkload = (teamId: string) => fetch(`${API}/workload/team/${teamId}`, { headers: h() }).then(r => r.json());
