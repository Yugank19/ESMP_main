"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, CheckCircle2, XCircle, RotateCcw, Clock, X, 
    ArrowLeft, ShieldCheck, FileText, User, Calendar, 
    ChevronRight, MessageSquare, AlertCircle, Inbox, 
    Send, Check, Ban, ClipboardCheck, History
} from 'lucide-react';
import { createApproval, getMyRequests, getPendingForMe, actOnStep } from '@/lib/approvals-api';
import { cn } from '@/lib/utils';

const TYPES = ['LEAVE', 'ACCESS', 'DOCUMENT', 'TICKET', 'TASK_COMPLETION', 'CHANGE_REQUEST'];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  REJECTED: 'bg-red-50 text-red-700 border-red-100',
  RETURNED: 'bg-orange-50 text-orange-700 border-orange-100',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
};

const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase tracking-tight";
const labelClass = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 block pl-1";

export default function ApprovalsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'mine' | 'pending'>('mine');
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [pendingForMe, setPendingForMe] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [actModal, setActModal] = useState<any>(null);
  const [actComment, setActComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', type: 'LEAVE', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, pending] = await Promise.all([getMyRequests(), getPendingForMe()]);
      setMyRequests(Array.isArray(mine) ? mine : []);
      setPendingForMe(Array.isArray(pending) ? pending : []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if ((u.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    load();
  }, [load, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { 
        await createApproval(form); 
        setShowCreate(false); 
        setForm({ title: '', type: 'LEAVE', description: '' }); 
        load(); 
    } catch (err: any) { 
        alert(err.message); 
    }
  }

  async function handleAct(action: string) {
    if (!actModal) return;
    try { 
        await actOnStep(actModal.id, action, actComment); 
        setActModal(null); 
        setActComment(''); 
        load(); 
    } catch (err: any) { 
        alert(err.message); 
    }
  }

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2.5 rounded-[3px] bg-white border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Governance & Approvals</h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Protocol-based authorization and workflow verification</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="jira-button jira-button-primary h-12 px-8 gap-3 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" /> New Request
        </button>
      </div>

      {/* Modern Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border)] gap-8">
        <div className="flex items-center">
            {[
                { id: 'mine', label: 'My Submissions', count: myRequests.length, icon: Send },
                { id: 'pending', label: 'Awaiting Authorization', count: pendingForMe.length, icon: Inbox }
            ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setTab(t.id as any)}
                  className={cn(
                    "relative px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3",
                    tab === t.id ? "text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <t.icon className={cn("h-4 w-4", tab === t.id ? "text-[var(--color-primary)]" : "text-slate-300")} />
                  {t.label}
                  <span className={cn(
                      "ml-2 px-2 py-0.5 rounded-[2px] text-[9px] border",
                      tab === t.id ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100"
                  )}>
                      {t.count}
                  </span>
                  {tab === t.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)] animate-in slide-in-from-left duration-300" />
                  )}
                </button>
            ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                  <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Synchronizing Workflow State...</span>
             </div>
        ) : (
            tab === 'mine' ? (
                <div className="grid grid-cols-1 gap-4">
                  {myRequests.length === 0 ? (
                    <div className="card p-32 text-center flex flex-col items-center opacity-30">
                        <History className="h-16 w-16 text-[var(--text-muted)] mb-6 stroke-[1px]" />
                        <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Submission Log Empty</h3>
                        <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">No active authorization requests recorded in your sector.</p>
                    </div>
                  ) : (
                    myRequests.map(r => (
                      <div key={r.id} className="card p-0 overflow-hidden border-[var(--border)] hover:border-[var(--color-primary)] transition-all group">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-[3px] bg-slate-50 border border-[var(--border)] flex items-center justify-center text-[var(--color-primary)] shadow-sm">
                                          <FileText className="h-5 w-5" />
                                     </div>
                                     <div>
                                         <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{r.title}</p>
                                         <div className="flex items-center gap-2 mt-1">
                                              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-[2px]">{r.type}</span>
                                              <span className="text-[9px] font-bold text-slate-300 uppercase shrink-0">·</span>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                  <Calendar className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}
                                              </span>
                                         </div>
                                     </div>
                                </div>
                                <span className={cn("px-2.5 py-1 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-[0.1em] shadow-sm", STATUS_COLORS[r.status])}>
                                    {r.status}
                                </span>
                            </div>

                            {/* Workflow Chain */}
                            <div className="bg-slate-50/50 border border-[var(--border)] border-dashed rounded-[3px] p-4 flex items-center flex-wrap gap-y-4">
                                {r.steps?.map((s: any, i: number) => (
                                  <div key={s.id} className="flex items-center group/step">
                                    {i > 0 && <ChevronRight className="h-4 w-4 mx-3 text-slate-200" />}
                                    <div className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-[3px] border shadow-sm transition-all",
                                        s.status === 'PENDING' ? "bg-white border-[var(--color-primary)] ring-2 ring-blue-50" : "bg-white border-[var(--border)] opacity-60"
                                    )}>
                                      <div className={cn(
                                          "w-6 h-6 rounded-full flex items-center justify-center border",
                                          s.status === 'APPROVED' ? "bg-emerald-500 border-emerald-500 text-white" : s.status === 'REJECTED' ? "bg-red-500 border-red-500 text-white" : "bg-blue-50 border-blue-200 text-[var(--color-primary)]"
                                      )}>
                                        {s.status === 'APPROVED' ? <Check className="h-3 w-3" /> : s.status === 'REJECTED' ? <X className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                      </div>
                                      <div className="min-w-0">
                                          <p className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-tight truncate max-w-[120px]">{s.approver?.name}</p>
                                          <p className={cn("text-[8px] font-extrabold uppercase tracking-tighter", 
                                              s.status === 'APPROVED' ? "text-emerald-600" : s.status === 'REJECTED' ? "text-red-600" : "text-blue-600"
                                          )}>{s.status}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                  {pendingForMe.length === 0 ? (
                    <div className="card p-32 text-center flex flex-col items-center opacity-30">
                        <ClipboardCheck className="h-16 w-16 text-[var(--text-muted)] mb-6 stroke-[1px]" />
                        <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Queue Neutralized</h3>
                        <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">Zero pending actions assigned to your identification.</p>
                    </div>
                  ) : (
                    pendingForMe.map(step => (
                      <div key={step.id} className="card p-0 overflow-hidden border-[var(--color-primary)] shadow-md group animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row">
                             <div className="flex-1 p-6 space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-[0.2em] mb-1">Authorization Required</h4>
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{step.request?.title}</h3>
                                </div>
                                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                                     <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-[2px]">{step.request?.type}</span>
                                     </div>
                                     <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                          <User className="h-3.5 w-3.5 text-[var(--color-primary)]" /> FROM {step.request?.requester?.name}
                                     </div>
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                          <Calendar className="h-3.5 w-3.5" /> {new Date(step.request?.created_at).toLocaleDateString()}
                                     </div>
                                </div>
                                {step.request?.description && (
                                    <div className="p-4 bg-slate-50 border border-[var(--border)] rounded-[3px] border-l-4 border-l-blue-400">
                                         <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed italic">"{step.request.description}"</p>
                                    </div>
                                )}
                             </div>
                             
                             {/* Decision Terminal */}
                             <div className="md:w-72 bg-[var(--bg-surface-2)] border-t md:border-t-0 md:border-l border-[var(--border)] p-6 space-y-3 flex flex-col justify-center">
                                <button onClick={() => setActModal({ ...step, _action: 'APPROVED' })}
                                  className="jira-button bg-emerald-600 text-white h-11 gap-3 font-bold uppercase text-[10px] hover:bg-emerald-700 shadow-md shadow-emerald-50">
                                  <CheckCircle2 className="h-4 w-4" /> Certify Authority
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                     <button onClick={() => setActModal({ ...step, _action: 'RETURNED' })}
                                      className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-11 gap-2 font-bold uppercase text-[10px] hover:border-orange-300 hover:text-orange-600">
                                      <RotateCcw className="h-3.5 w-3.5" /> Return
                                    </button>
                                    <button onClick={() => setActModal({ ...step, _action: 'REJECTED' })}
                                      className="jira-button border border-red-100 bg-red-50 text-red-600 h-11 gap-2 font-bold uppercase text-[10px] hover:bg-red-100">
                                      <Ban className="h-3.5 w-3.5" /> Reject
                                    </button>
                                </div>
                             </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
            )
        )}
      </div>

      {/* Creation Terminal Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[var(--color-primary)]" />
                  <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">New Authorization Protocol</h2>
              </div>
              <button 
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-[3px] hover:bg-white hover:border-[var(--border)] border border-transparent transition-all"
              >
                  <X className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className={labelClass}>Protocol Designation (Title) *</label>
                <input required value={form.title} placeholder="REQUEST_ALPHA_IDENTIFIER" onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Workflow Logic (Type)</label>
                <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-primary)]" />
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className={cn(inputClass, "pl-10 appearance-none bg-slate-50")}>
                      {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')} AUTHORITY</option>)}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 rotate-90" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Technical Requirements / description</label>
                <textarea rows={4} value={form.description} placeholder="Provide comprehensive justification for this authorization protocol..." onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={cn(inputClass, "resize-none font-medium normal-case")} />
              </div>
              <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
                <button type="submit" className="jira-button jira-button-primary h-12 flex-1 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">Broadcast Protocol</button>
                <button type="button" onClick={() => setShowCreate(false)} className="jira-button border border-[var(--border)] h-12 flex-1 font-bold uppercase text-[10px] bg-white text-[var(--text-muted)]">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Finalization Modal */}
      {actModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-8 py-6 space-y-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {actModal._action === 'APPROVED' ? 'Finalize Certification' : actModal._action === 'REJECTED' ? 'Confirm Rejection' : 'Internal Return'}
                </h2>
                <div className="space-y-2">
                    <label className={labelClass}>Decision Analytics (Comments)</label>
                    <textarea rows={4} value={actComment} onChange={e => setActComment(e.target.value)}
                      placeholder="Append analysis and technical justification to the mission log..."
                      className={cn(inputClass, "resize-none font-medium normal-case")} />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleAct(actModal._action)}
                    className={cn(
                        "h-12 flex-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg transition-all rounded-[3px]",
                        actModal._action === 'APPROVED' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-50" : actModal._action === 'REJECTED' ? "bg-red-600 hover:bg-red-700 shadow-red-50" : "bg-[var(--color-primary)] hover:bg-blue-700 shadow-blue-50"
                    )}>
                    Confirm Execution
                  </button>
                  <button onClick={() => setActModal(null)} className="h-12 flex-1 border border-[var(--border)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest rounded-[3px] hover:bg-slate-50 transition-all">Cancel</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
