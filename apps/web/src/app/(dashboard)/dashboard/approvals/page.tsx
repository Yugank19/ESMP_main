"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, CheckCircle, XCircle, RotateCcw, Clock, X } from 'lucide-react';
import { createApproval, getMyRequests, getPendingForMe, actOnStep } from '@/lib/approvals-api';

const TYPES = ['LEAVE', 'ACCESS', 'DOCUMENT', 'TICKET', 'TASK_COMPLETION', 'CHANGE_REQUEST'];
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  RETURNED: 'bg-orange-50 text-orange-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function ApprovalsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'mine' | 'pending'>('mine');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [pendingForMe, setPendingForMe] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [actModal, setActModal] = useState<any>(null);
  const [actComment, setActComment] = useState('');
  const [form, setForm] = useState({ title: '', type: 'LEAVE', description: '' });

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if ((u.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    load();
  }, []);

  async function load() {
    try {
      const [mine, pending] = await Promise.all([getMyRequests(), getPendingForMe()]);
      setMyRequests(Array.isArray(mine) ? mine : []);
      setPendingForMe(Array.isArray(pending) ? pending : []);
    } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { await createApproval(form); setShowCreate(false); setForm({ title: '', type: 'LEAVE', description: '' }); load(); }
    catch (err: any) { alert(err.message); }
  }

  async function handleAct(action: string) {
    if (!actModal) return;
    try { await actOnStep(actModal.id, action, actComment); setActModal(null); setActComment(''); load(); }
    catch (err: any) { alert(err.message); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Approval Workflows</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Submit and track approval requests</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--jira-blue)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue-hover)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue)')}>
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {[{ id: 'mine', label: `My Requests (${myRequests.length})` }, { id: 'pending', label: `Pending My Action (${pendingForMe.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-[var(--jira-blue)] text-[var(--jira-blue)]' : 'border-transparent'}`}
            style={{ color: tab === t.id ? 'var(--jira-blue)' : 'var(--text-secondary)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* My Requests */}
      {tab === 'mine' && (
        <div className="rounded" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
          {myRequests.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No requests yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {myRequests.map(r => (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{r.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{r.type} · {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`lozenge ${STATUS_COLORS[r.status] || 'lozenge-default'}`}>{r.status}</span>
                  </div>
                  {/* Step progress */}
                  <div className="flex items-center gap-2 mt-3">
                    {r.steps?.map((s: any, i: number) => (
                      <div key={s.id} className="flex items-center gap-1">
                        {i > 0 && <div className="w-6 h-px" style={{ background: 'var(--border)' }} />}
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[s.status] || 'lozenge-default'}`}>
                          {s.status === 'APPROVED' ? <CheckCircle className="h-3 w-3" /> : s.status === 'REJECTED' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {s.approver?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending for me */}
      {tab === 'pending' && (
        <div className="rounded" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
          {pendingForMe.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No pending approvals</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {pendingForMe.map(step => (
                <div key={step.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{step.request?.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {step.request?.type} · from {step.request?.requester?.name} · {new Date(step.request?.created_at).toLocaleDateString()}
                    </p>
                    {step.request?.description && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{step.request.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setActModal({ ...step, _action: 'APPROVED' })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: '#00875A' }}>
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => setActModal({ ...step, _action: 'RETURNED' })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold"
                      style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}>
                      <RotateCcw className="h-3.5 w-3.5" /> Return
                    </button>
                    <button onClick={() => setActModal({ ...step, _action: 'REJECTED' })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold"
                      style={{ background: '#FFEBE6', color: '#DE350B' }}>
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-lg p-6" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>New Approval Request</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: 'var(--jira-blue)' }}>Submit</button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Act Modal */}
      {actModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-lg p-6" style={{ background: 'var(--bg-surface)' }}>
            <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {actModal._action === 'APPROVED' ? 'Approve' : actModal._action === 'REJECTED' ? 'Reject' : 'Return'} Request
            </h2>
            <textarea rows={3} value={actComment} onChange={e => setActComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              className="w-full border rounded px-3 py-2 text-sm outline-none resize-none mb-4"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
            <div className="flex gap-3">
              <button onClick={() => handleAct(actModal._action)}
                className="flex-1 py-2 rounded text-sm font-semibold text-white"
                style={{ backgroundColor: actModal._action === 'APPROVED' ? '#00875A' : actModal._action === 'REJECTED' ? '#DE350B' : 'var(--jira-blue)' }}>
                Confirm
              </button>
              <button onClick={() => setActModal(null)} className="flex-1 py-2 rounded text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
