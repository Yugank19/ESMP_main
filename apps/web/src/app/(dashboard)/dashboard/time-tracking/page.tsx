"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, Trash2, X , ArrowLeft} from 'lucide-react';
import { logTime, getMyEntries, getWeeklySheet, deleteTimeEntry } from '@/lib/time-tracking-api';

export default function TimeTrackingPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<any>(null);
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], hours: '', description: '', task_id: '', ticket_id: '' });

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    if ((JSON.parse(s).roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    load();
  }, []);

  async function load() {
    try {
      const [e, w] = await Promise.all([getMyEntries(), getWeeklySheet()]);
      setEntries(Array.isArray(e) ? e : []);
      setWeekly(w);
    } catch {}
  }

  async function handleLog(ev: React.FormEvent) {
    ev.preventDefault();
    try { await logTime(form); setShowLog(false); setForm({ date: new Date().toISOString().split('T')[0], hours: '', description: '', task_id: '', ticket_id: '' }); load(); }
    catch (err: any) { alert(err.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    await deleteTimeEntry(id);
    load();
  }

  const totalHours = entries.reduce((s, e) => s + e.hours, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface-2)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-3)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Time Tracking</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Log and review your work hours</p>
          </div>
        </div>
        <button onClick={() => setShowLog(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--jira-blue)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue)')}>
          <Plus className="h-4 w-4" /> Log Time
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Hours Logged', value: totalHours.toFixed(1) + 'h' },
          { label: 'This Week', value: (weekly?.totalHours || 0).toFixed(1) + 'h' },
          { label: 'Entries', value: entries.length },
          { label: 'Avg per Day', value: entries.length ? (totalHours / Math.max(new Set(entries.map((e: any) => e.date?.split('T')[0])).size, 1)).toFixed(1) + 'h' : '0h' },
        ].map(c => (
          <div key={c.label} className="rounded p-4" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
            <p className="text-2xl font-bold" style={{ color: 'var(--jira-blue)' }}>{c.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Entries table */}
      <div className="rounded" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Clock className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Time Entries</span>
        </div>
        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No time logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--border)`, background: 'var(--bg-surface-2)' }}>
                  {['Date', 'Hours', 'Description', 'Linked To', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{ borderBottom: `1px solid var(--border)` }}>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--jira-blue)' }}>{e.hours}h</td>
                    <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-primary)' }}>{e.description || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {e.task_id ? 'Task' : e.ticket_id ? 'Ticket' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Modal */}
      {showLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-lg p-6" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Log Time</h2>
              <button onClick={() => setShowLog(false)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <form onSubmit={handleLog} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Hours *</label>
                  <input type="number" step="0.25" min="0.25" max="24" required value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                    placeholder="e.g. 2.5"
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What did you work on?"
                  className="w-full border rounded px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: 'var(--jira-blue)' }}>Save Entry</button>
                <button type="button" onClick={() => setShowLog(false)} className="flex-1 py-2 rounded text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
