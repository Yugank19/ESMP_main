"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, Pin, Plus, X } from 'lucide-react';
import { getAnnouncements, createAnnouncement } from '@/lib/company-announcements-api';

const TYPES = ['GENERAL', 'URGENT', 'POLICY', 'HOLIDAY', 'MEETING', 'TEAM'];
const TYPE_COLORS: Record<string, string> = {
  GENERAL: 'lozenge-default', URGENT: 'lozenge-danger', POLICY: 'lozenge-info',
  HOLIDAY: 'lozenge-success', MEETING: 'lozenge-warning', TEAM: 'lozenge-info',
};

export default function CompanyNewsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ title: '', body: '', type: 'GENERAL', is_pinned: false, expires_at: '' });

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if ((u.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    const role = (u.roles?.[0] || '').toUpperCase();
    setIsManager(['MANAGER', 'ADMIN'].includes(role));
    load();
  }, []);

  async function load(t = filterType) {
    try {
      const data = await getAnnouncements(t ? { type: t } : {});
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { await createAnnouncement(form); setShowCreate(false); setForm({ title: '', body: '', type: 'GENERAL', is_pinned: false, expires_at: '' }); load(); }
    catch (err: any) { alert(err.message); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Company Announcements</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Company-wide news, policies, and notices</p>
        </div>
        {isManager && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--jira-blue)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue-hover)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue)')}>
            <Plus className="h-4 w-4" /> Post Announcement
          </button>
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        {['', ...TYPES].map(t => (
          <button key={t} onClick={() => { setFilterType(t); load(t); }}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${filterType === t ? 'text-white' : 'border'}`}
            style={filterType === t ? { backgroundColor: 'var(--jira-blue)' } : { borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}>
            {t || 'All'}
          </button>
        ))}
      </div>

      {/* Announcements */}
      {announcements.length === 0 ? (
        <div className="rounded p-12 text-center" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
          <Megaphone className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No announcements</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="rounded p-5" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)', borderLeft: a.type === 'URGENT' ? '4px solid #DE350B' : a.is_pinned ? '4px solid var(--jira-blue)' : '4px solid transparent' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`lozenge ${TYPE_COLORS[a.type] || 'lozenge-default'}`}>{a.type}</span>
                    {a.is_pinned && <Pin className="h-3.5 w-3.5" style={{ color: 'var(--jira-blue)' }} />}
                  </div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a.body}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Posted by {a.author?.name}</span>
                <span>·</span>
                <span>{new Date(a.created_at).toLocaleDateString()}</span>
                {a.expires_at && <><span>·</span><span>Expires {new Date(a.expires_at).toLocaleDateString()}</span></>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-lg p-6" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Post Announcement</h2>
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
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Expires (optional)</label>
                  <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Content *</label>
                <textarea required rows={5} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
                Pin to top
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: 'var(--jira-blue)' }}>Post</button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
