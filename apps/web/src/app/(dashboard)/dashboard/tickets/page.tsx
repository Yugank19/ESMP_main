"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Ticket, AlertCircle, Clock, CheckCircle, X, Filter } from 'lucide-react';
import { getTickets, getTicketStats, createTicket, updateTicket, addTicketComment } from '@/lib/tickets-api';

const CATEGORIES = ['IT', 'HR', 'BUG', 'SUPPORT', 'ACCESS', 'EQUIPMENT', 'LEAVE', 'GENERAL'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  ON_HOLD: 'bg-slate-100 text-slate-600',
  RESOLVED: 'bg-green-50 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-red-50 text-red-600',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-orange-50 text-orange-700',
  CRITICAL: 'bg-red-50 text-red-700',
};

export default function TicketsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: 'IT', priority: 'MEDIUM', department: '', due_date: '' });

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    const role = (u.roles?.[0] || '').toUpperCase();
    if (role === 'STUDENT') { router.push('/dashboard'); return; }
    setUser(u);
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([getTickets(filterStatus ? { status: filterStatus } : {}), getTicketStats()]);
      setTickets(Array.isArray(t) ? t : []);
      setStats(s);
    } catch {}
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTicket(form);
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'IT', priority: 'MEDIUM', department: '', due_date: '' });
      load();
    } catch (err: any) { alert(err.message); }
  }

  async function handleStatusChange(id: string, status: string) {
    await updateTicket(id, { status });
    load();
    if (selected?.id === id) setSelected((p: any) => ({ ...p, status }));
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !selected) return;
    const c = await addTicketComment(selected.id, comment);
    setSelected((p: any) => ({ ...p, comments: [...(p.comments || []), c] }));
    setComment('');
  }

  const statCards = [
    { label: 'Total', value: stats?.total ?? 0, icon: Ticket, color: 'text-blue-600 bg-blue-50' },
    { label: 'Open', value: stats?.open ?? 0, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, icon: Clock, color: 'text-purple-600 bg-purple-50' },
    { label: 'Resolved', value: stats?.resolved ?? 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Service Requests</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Raise and track IT, HR, and support tickets</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--jira-blue)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue)')}>
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="rounded p-4 flex items-center gap-3" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
            <div className={`w-10 h-10 rounded flex items-center justify-center ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Table */}
      <div className="rounded" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
        <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <Filter className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); load(); }}
            className="text-sm border rounded px-2 py-1 outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No tickets yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Create your first service request</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--border)`, background: 'var(--bg-surface-2)' }}>
                  {['Ticket #', 'Title', 'Category', 'Priority', 'Status', 'Assignee', 'Created'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} onClick={() => setSelected(t)} className="cursor-pointer transition-colors"
                    style={{ borderBottom: `1px solid var(--border)` }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--jira-blue)' }}>{t.ticket_no}</td>
                    <td className="px-4 py-3 font-medium max-w-xs truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</td>
                    <td className="px-4 py-3"><span className="lozenge lozenge-default">{t.category}</span></td>
                    <td className="px-4 py-3"><span className={`lozenge ${PRIORITY_COLORS[t.priority] || 'lozenge-default'}`}>{t.priority}</span></td>
                    <td className="px-4 py-3"><span className={`lozenge ${STATUS_COLORS[t.status] || 'lozenge-default'}`}>{t.status}</span></td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{t.assignee?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-lg p-6" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>New Service Request</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Description *</label>
                <textarea required rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Department</label>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: 'var(--jira-blue)' }}>Submit Request</button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded text-sm font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50">
          <div className="w-full max-w-xl h-full overflow-y-auto p-6 space-y-4" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs font-semibold" style={{ color: 'var(--jira-blue)' }}>{selected.ticket_no}</p>
                <h2 className="text-base font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`lozenge ${STATUS_COLORS[selected.status] || 'lozenge-default'}`}>{selected.status}</span>
              <span className={`lozenge ${PRIORITY_COLORS[selected.priority] || 'lozenge-default'}`}>{selected.priority}</span>
              <span className="lozenge lozenge-default">{selected.category}</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selected.description}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span style={{ color: 'var(--text-muted)' }}>Created by:</span> <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selected.creator?.name}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Assigned to:</span> <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selected.assignee?.name || 'Unassigned'}</span></div>
              {selected.department && <div><span style={{ color: 'var(--text-muted)' }}>Department:</span> <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selected.department}</span></div>}
              {selected.due_date && <div><span style={{ color: 'var(--text-muted)' }}>Due:</span> <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{new Date(selected.due_date).toLocaleDateString()}</span></div>}
            </div>
            {/* Status change */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Update Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(selected.id, s)}
                    className={`lozenge cursor-pointer transition-opacity ${selected.status === s ? 'opacity-100 ring-2 ring-offset-1 ring-blue-400' : 'opacity-60 hover:opacity-100'} ${STATUS_COLORS[s] || 'lozenge-default'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {/* Comments */}
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Comments ({selected.comments?.length || 0})</h3>
              <div className="space-y-3 mb-3">
                {(selected.comments || []).map((c: any) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: 'var(--jira-blue)' }}>
                      {c.user?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 rounded p-3" style={{ background: 'var(--bg-surface-2)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{c.user?.name}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleComment} className="flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..."
                  className="flex-1 border rounded px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                <button type="submit" className="px-4 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: 'var(--jira-blue)' }}>Post</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
