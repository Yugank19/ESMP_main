"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bug, X, Trash2, ArrowLeft } from 'lucide-react';
import { getBugs, createBug, updateBug, addBugComment, deleteBug } from '@/lib/bugs-api';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'FIXED', 'TESTING', 'CLOSED', 'WONT_FIX'];
const ENVS = ['PRODUCTION', 'STAGING', 'DEV'];
const SEV_COLORS: Record<string, string> = { LOW: 'bg-slate-100 text-slate-600', MEDIUM: 'bg-blue-50 text-blue-700', HIGH: 'bg-orange-50 text-orange-700', CRITICAL: 'bg-red-50 text-red-700' };
const STATUS_COLORS: Record<string, string> = { OPEN: 'bg-red-50 text-red-700', IN_PROGRESS: 'bg-amber-50 text-amber-700', FIXED: 'bg-green-50 text-green-700', TESTING: 'bg-purple-50 text-purple-700', CLOSED: 'bg-slate-100 text-slate-500', WONT_FIX: 'bg-slate-100 text-slate-400' };

export default function BugsPage() {
  const router = useRouter();
  const [bugs, setBugs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [comment, setComment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ title: '', description: '', severity: 'MEDIUM', priority: 'MEDIUM', environment: 'DEV', steps_to_reproduce: '', expected_behavior: '', actual_behavior: '' });

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    if ((JSON.parse(s).roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    load();
  }, []);

  async function load() {
    try { const b = await getBugs(filterStatus ? { status: filterStatus } : {}); setBugs(Array.isArray(b) ? b : []); } catch {}
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this bug report? This cannot be undone.')) return;
    try { await deleteBug(id); setSelected(null); load(); } catch { alert('Failed to delete bug'); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { await createBug(form); setShowCreate(false); load(); } catch (err: any) { alert(err.message); }
  }

  async function handleStatusChange(id: string, status: string) {
    await updateBug(id, { status });
    load();
    if (selected?.id === id) setSelected((p: any) => ({ ...p, status }));
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !selected) return;
    const c = await addBugComment(selected.id, comment);
    setSelected((p: any) => ({ ...p, comments: [...(p.comments || []), c] }));
    setComment('');
  }

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
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Bug Tracker</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Report and track bugs and issues</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--jira-blue)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue)')}>
          <Plus className="h-4 w-4" /> Report Bug
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => { setFilterStatus(s); setTimeout(load, 0); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${filterStatus === s ? 'text-white' : 'border'}`}
            style={filterStatus === s ? { backgroundColor: 'var(--jira-blue)' } : { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Bug list */}
      <div className="rounded" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
        {bugs.length === 0 ? (
          <div className="p-12 text-center">
            <Bug className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No bugs reported</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid var(--border)`, background: 'var(--bg-surface-2)' }}>
                  {['Title', 'Severity', 'Priority', 'Status', 'Environment', 'Reporter', 'Assignee'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bugs.map(b => (
                  <tr key={b.id} onClick={() => setSelected(b)} className="cursor-pointer transition-colors"
                    style={{ borderBottom: `1px solid var(--border)` }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-4 py-3 font-medium max-w-xs truncate" style={{ color: 'var(--text-primary)' }}>{b.title}</td>
                    <td className="px-4 py-3"><span className={`lozenge ${SEV_COLORS[b.severity] || 'lozenge-default'}`}>{b.severity}</span></td>
                    <td className="px-4 py-3"><span className={`lozenge ${SEV_COLORS[b.priority] || 'lozenge-default'}`}>{b.priority}</span></td>
                    <td className="px-4 py-3"><span className={`lozenge ${STATUS_COLORS[b.status] || 'lozenge-default'}`}>{b.status}</span></td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{b.environment || '—'}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{b.reporter?.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{b.assignee?.name || '—'}</td>
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
          <div className="w-full max-w-lg rounded-lg p-6 overflow-y-auto max-h-[90vh]" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Report a Bug</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[['severity', SEVERITIES], ['priority', SEVERITIES], ['environment', ENVS]].map(([field, opts]) => (
                  <div key={field as string}>
                    <label className="block text-xs font-semibold mb-1 capitalize" style={{ color: 'var(--text-secondary)' }}>{field as string}</label>
                    <select value={(form as any)[field as string]} onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))}
                      className="w-full border rounded px-2 py-2 text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                      {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {[['description', 'Description *', true], ['steps_to_reproduce', 'Steps to Reproduce', false], ['expected_behavior', 'Expected Behavior', false], ['actual_behavior', 'Actual Behavior', false]].map(([field, label, req]) => (
                <div key={field as string}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label as string}</label>
                  <textarea required={req as boolean} rows={2} value={(form as any)[field as string]} onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none resize-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: 'var(--jira-blue)' }}>Submit Bug</button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
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
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{selected.title}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDelete(selected.id)} title="Delete bug"
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={() => setSelected(null)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`lozenge ${SEV_COLORS[selected.severity] || 'lozenge-default'}`}>{selected.severity}</span>
              <span className={`lozenge ${STATUS_COLORS[selected.status] || 'lozenge-default'}`}>{selected.status}</span>
              {selected.environment && <span className="lozenge lozenge-default">{selected.environment}</span>}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selected.description}</p>
            {selected.steps_to_reproduce && <div><p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>STEPS TO REPRODUCE</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selected.steps_to_reproduce}</p></div>}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Update Status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(selected.id, s)}
                    className={`lozenge cursor-pointer ${selected.status === s ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-60 hover:opacity-100'} ${STATUS_COLORS[s] || 'lozenge-default'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Comments</h3>
              <div className="space-y-3 mb-3">
                {(selected.comments || []).map((c: any) => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: 'var(--jira-blue)' }}>{c.user?.name?.[0] || '?'}</div>
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
