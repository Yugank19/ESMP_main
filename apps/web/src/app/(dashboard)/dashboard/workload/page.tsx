"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, AlertTriangle, CheckCircle, Clock, BarChart2 } from 'lucide-react';
import { getTeamWorkload } from '@/lib/workload-api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  AVAILABLE:  { label: 'Available',  color: '#00875A', bg: '#E3FCEF' },
  BUSY:       { label: 'Busy',       color: '#FF8B00', bg: '#FFFAE6' },
  OVERLOADED: { label: 'Overloaded', color: '#DE350B', bg: '#FFEBE6' },
};

export default function WorkloadPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [workload, setWorkload] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if ((u.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    const role = (u.roles?.[0] || '').toUpperCase();
    setIsManager(['MANAGER', 'ADMIN'].includes(role));
    loadTeams();
  }, []);

  useEffect(() => { if (selectedTeam) loadWorkload(selectedTeam); }, [selectedTeam]);

  async function loadTeams() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTeams(list);
      if (list.length > 0) setSelectedTeam(list[0].id);
    } catch {}
  }

  async function loadWorkload(teamId: string) {
    setLoading(true);
    try { const data = await getTeamWorkload(teamId); setWorkload(data); } catch {}
    setLoading(false);
  }

  const members = workload?.members || [];
  const overloaded = members.filter((m: any) => m.status === 'OVERLOADED').length;
  const available = members.filter((m: any) => m.status === 'AVAILABLE').length;
  const totalHours = members.reduce((s: number, m: any) => s + (m.hoursThisWeek || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Resource Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Team capacity, workload, and availability</p>
        </div>
        {teams.length > 0 && (
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
            className="border rounded px-3 py-2 text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
            {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Team Members', value: members.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Overloaded', value: overloaded, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          { label: 'Available', value: available, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Team Hours (Week)', value: totalHours.toFixed(1) + 'h', icon: Clock, color: 'text-purple-600 bg-purple-50' },
        ].map(c => (
          <div key={c.label} className="rounded p-4 flex items-center gap-3" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
            <div className={`w-10 h-10 rounded flex items-center justify-center ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Member workload table */}
      <div className="rounded" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <BarChart2 className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Member Workload</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No team members</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--border)`, background: 'var(--bg-surface-2)' }}>
                  {['Member', 'Role', 'Active Tasks', 'Overdue', 'Open Tickets', 'Hours (Week)', 'Utilization', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m: any) => {
                  const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.AVAILABLE;
                  return (
                    <tr key={m.user.id} style={{ borderBottom: `1px solid var(--border)` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: 'var(--jira-blue)' }}>
                            {m.user.name?.[0] || '?'}
                          </div>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{m.user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="lozenge lozenge-default">{m.role}</span></td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{m.activeTasks}</td>
                      <td className="px-4 py-3">
                        {m.overdueTasks > 0
                          ? <span className="lozenge lozenge-danger">{m.overdueTasks}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>0</span>}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{m.openTickets}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--jira-blue)' }}>{(m.hoursThisWeek || 0).toFixed(1)}h</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-3)', minWidth: 60 }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${m.utilization}%`, backgroundColor: cfg.color }} />
                          </div>
                          <span className="text-xs font-semibold w-8 text-right" style={{ color: cfg.color }}>{m.utilization}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="lozenge text-xs font-bold" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Capacity guide */}
      <div className="rounded p-4" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>CAPACITY GUIDE</p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
            <div key={cfg.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
            </div>
          ))}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· Utilization based on active tasks + open tickets</span>
        </div>
      </div>
    </div>
  );
}
