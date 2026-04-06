"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, Ticket, AlertCircle, Clock, CheckCircle2, X, Filter, 
    Trash2, ArrowLeft, MessageSquare, Briefcase, Calendar, 
    ChevronRight, Hash, Send, User, ShieldCheck, Zap, 
    Target, Building, HelpCircle, Activity
} from 'lucide-react';
import { getTickets, getTicketStats, createTicket, updateTicket, addTicketComment, deleteTicket } from '@/lib/tickets-api';
import { cn } from '@/lib/utils';

const CATEGORIES = ['IT', 'HR', 'BUG', 'SUPPORT', 'ACCESS', 'EQUIPMENT', 'LEAVE', 'GENERAL'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700 border-blue-100',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-100',
  ON_HOLD: 'bg-slate-100 text-slate-600 border-slate-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CLOSED: 'bg-slate-100 text-slate-500 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-100',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-100',
  CRITICAL: 'bg-red-50 text-red-700 border-red-100',
};

const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase tracking-tight";
const labelClass = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 block pl-1";

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([getTickets(filterStatus ? { status: filterStatus } : {}), getTicketStats()]);
      setTickets(Array.isArray(t) ? t : []);
      setStats(s);
    } catch {}
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if ((u.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    setUser(u);
    load();
  }, [load, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTicket(form);
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'IT', priority: 'MEDIUM', department: '', due_date: '' });
      load();
    } catch (err: any) { alert(err.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Purge this service request? This action is final.')) return;
    try { await deleteTicket(id); setSelected(null); load(); } catch { alert('Failed to delete ticket'); }
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
    { label: 'Total Requests', value: stats?.total ?? 0, icon: Ticket, color: 'text-blue-600 bg-blue-50 border-blue-100', desc: 'Global queue synchronization' },
    { label: 'Unresolved', value: stats?.open ?? 0, icon: AlertCircle, color: 'text-orange-600 bg-orange-50 border-orange-100', desc: 'Critical path intervention needed' },
    { label: 'Operational', value: stats?.inProgress ?? 0, icon: Activity, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', desc: 'Active triage and resolution' },
    { label: 'Neutralized', value: stats?.resolved ?? 0, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', desc: 'Successfully closed protocols' },
  ];

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
            <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Service Desk / Support Terminal</h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Enterprise support protocols and resource allocation</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="jira-button jira-button-primary h-12 px-8 gap-3 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" /> Initialize Request
        </button>
      </div>

      {/* High-Fidelity Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map(s => (
          <div key={s.label} className="card p-6 border-[var(--border)] hover:border-[var(--color-primary)] transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-[3px] flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform", s.color)}>
                    <s.icon className="h-6 w-6" />
                </div>
                <Zap className="h-4 w-4 text-slate-100 group-hover:text-blue-100 transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest mt-1">{s.label}</p>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter mt-1 opacity-60">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Table Area */}
      <div className="card p-0 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
            <div className="flex items-center gap-4">
                 <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 border-r border-[var(--border)] pr-6">
                     <Filter className="h-3.5 w-3.5" /> Protocol Filter
                 </div>
                 <div className="relative group">
                    <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); load(); }}
                        className="bg-white border border-[var(--border)] rounded-[3px] px-8 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none appearance-none cursor-pointer">
                        <option value="">ALL_PROTOCOLS</option>
                        {STATUSES.map(s => <option key={s} value={s}>{s}_STATE</option>)}
                    </select>
                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 pointer-events-none rotate-90" />
                 </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{loading ? 'Synchronizing Data Grid...' : `Active Identification: ${tickets.length} Units`}</span>
            </div>
        </div>

        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                  <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Executing Data Stream Query...</span>
             </div>
        ) : tickets.length === 0 ? (
          <div className="p-32 text-center flex flex-col items-center opacity-30">
            <HelpCircle className="h-20 w-20 text-[var(--text-muted)] mb-6 stroke-[1px]" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Support Queue Clear</h3>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">No active support requests detected within current scope.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
                  {['Identifier', 'Request Intel', 'Category', 'Priority', 'Current State', 'Technician', 'Initialized'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] first:pl-8">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map(t => (
                  <tr key={t.id} onClick={() => setSelected(t)} className="group cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 first:pl-8">
                        <span className="font-mono text-[10px] font-bold text-[var(--color-primary)] bg-blue-50 px-2 py-1 rounded-[2px] border border-blue-100 tracking-widest">{t.ticket_no}</span>
                    </td>
                    <td className="px-6 py-5">
                         <div className="min-w-0">
                            <p className="text-sm font-bold text-[var(--text-primary)] truncate max-w-sm group-hover:text-[var(--color-primary)] transition-colors">{t.title}</p>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5 truncate max-w-[300px]">{t.description}</p>
                         </div>
                    </td>
                    <td className="px-6 py-5">
                        <span className="px-2 py-0.5 text-[9px] font-extrabold border border-slate-200 bg-slate-50 text-slate-500 rounded-[2px] uppercase tracking-widest shadow-sm">
                            {t.category}
                        </span>
                    </td>
                    <td className="px-6 py-5">
                        <span className={cn("px-2 py-0.5 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", PRIORITY_COLORS[t.priority])}>
                            {t.priority}
                        </span>
                    </td>
                    <td className="px-6 py-5">
                        <span className={cn("px-2 py-0.5 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", STATUS_COLORS[t.status])}>
                            {t.status.replace(/_/g, ' ')}
                        </span>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-200">
                                 {t.assignee?.name?.[0] || '—'}
                             </div>
                             <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">{t.assignee?.name || 'UNASSIGNED'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-5 text-right pr-8">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter tabular-nums">{new Date(t.created_at).toLocaleDateString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Initialization Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[var(--color-primary)]" />
                  <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">New Service Protocol</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-[3px] hover:bg-white hover:border-[var(--border)] border border-transparent transition-all">
                  <X className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
              <div>
                 <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Broadcast Service Request</h3>
                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Initialize formalized support request for resource allocation.</p>
              </div>

              <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Request Designation (Title) *</label>
                    <input required value={form.title} placeholder="SERVICE_IDENTIFIER_OMEGA" onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className={cn(inputClass, "uppercase")} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Operation Sector (Category)</label>
                      <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            className={cn(inputClass, "pl-10 appearance-none bg-slate-50")}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}_UNIT</option>)}
                          </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Response Priority</label>
                      <div className="relative">
                          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
                          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                            className={cn(inputClass, "pl-10 appearance-none bg-slate-50")}>
                            {PRIORITIES.map(p => <option key={p} value={p}>{p}_PRIORITY</option>)}
                          </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Technical Requirements / Description *</label>
                    <textarea required rows={4} value={form.description} placeholder="Provide comprehensive justification and heuristic details..." onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className={cn(inputClass, "resize-none font-medium normal-case")} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Target Department</label>
                      <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                          <input value={form.department} placeholder="E.G. SYSTEMS_OPS" onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                            className={cn(inputClass, "pl-10 uppercase")} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Termination Deadline</label>
                      <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                          <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                            className={cn(inputClass, "pl-10")} />
                      </div>
                    </div>
                  </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-[var(--border)]">
                <button type="submit" className="jira-button jira-button-primary h-12 flex-1 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">Transmit Request</button>
                <button type="button" onClick={() => setShowCreate(false)} className="jira-button border border-[var(--border)] h-12 flex-1 font-bold uppercase text-[10px] bg-white text-[var(--text-muted)]">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intelligence Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-[110] flex items-start justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto no-scrollbar animate-in slide-in-from-right-1/2 duration-500 border-l border-[var(--border)] flex flex-col">
            <div className="px-8 py-6 bg-[var(--bg-surface-2)] border-b border-[var(--border)] sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <Hash className="h-4 w-4 text-[var(--color-primary)]" />
                     <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">PROTOCOL_ID: {selected.ticket_no}</span>
                </div>
                <div className="flex items-center gap-3">
                    {(user?.roles?.[0]?.toUpperCase() === 'ADMIN' || user?.roles?.[0]?.toUpperCase() === 'MANAGER' || selected.created_by === user?.id) && (
                      <button onClick={() => handleDelete(selected.id)} className="p-2 rounded-[3px] text-red-400 hover:text-red-700 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => setSelected(null)} className="p-2 bg-white border border-[var(--border)] rounded-[3px] text-slate-400 hover:text-[var(--text-primary)] transition-all shadow-sm">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="p-8 space-y-12 flex-1">
                {/* Core Intel */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                         <span className={cn("px-2.5 py-1 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", STATUS_COLORS[selected.status])}>
                             STATE: {selected.status}
                         </span>
                         <span className={cn("px-2.5 py-1 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", PRIORITY_COLORS[selected.priority])}>
                             {selected.priority} RESPONSE
                         </span>
                         <span className="px-2.5 py-1 text-[9px] font-extrabold border border-slate-200 bg-slate-50 text-slate-500 rounded-[2px] uppercase tracking-widest shadow-sm">
                             {selected.category} UNIT
                         </span>
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{selected.title}</h2>
                    <div className="p-6 bg-slate-50 border border-[var(--border)] border-l-4 border-l-blue-400 rounded-[3px] shadow-sm">
                         <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed italic">"{selected.description}"</p>
                    </div>
                </div>

                {/* Personnel & Logistics */}
                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                    <div className="space-y-3">
                         <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                             <User className="h-3.5 w-3.5 text-blue-400" /> Originator
                         </h4>
                         <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px] font-extrabold text-slate-500">
                                  {selected.creator?.name?.[0] || 'O'}
                              </div>
                              <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase">{selected.creator?.name}</span>
                         </div>
                    </div>
                    <div className="space-y-3">
                         <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                             <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Technician
                         </h4>
                         <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] font-extrabold text-[var(--color-primary)]">
                                  {selected.assignee?.name?.[0] || '—'}
                              </div>
                              <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase">{selected.assignee?.name || 'UNASSIGNED'}</span>
                         </div>
                    </div>
                    {selected.department && (
                        <div className="space-y-3">
                             <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                 <Building className="h-3.5 w-3.5 text-slate-400" /> Sector
                             </h4>
                             <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase ml-5.5">{selected.department}</span>
                        </div>
                    )}
                    {selected.due_date && (
                        <div className="space-y-3">
                             <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                 <Target className="h-3.5 w-3.5 text-red-400" /> Deadline
                             </h4>
                             <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase ml-5.5">{new Date(selected.due_date).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {/* Protocol Execution Controls */}
                <div className="space-y-4 pt-8 border-t border-[var(--border)]">
                    <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[var(--color-primary)]" /> Transition State
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {STATUSES.map(s => (
                          <button key={s} onClick={() => handleStatusChange(selected.id, s)}
                            className={cn(
                                "h-12 rounded-[3px] text-[10px] font-bold uppercase tracking-widest transition-all scale-100 active:scale-95 flex items-center justify-center border shadow-sm",
                                selected.status === s 
                                    ? "ring-4 ring-blue-100/50 outline-2 outline-[var(--color-primary)] " + STATUS_COLORS[s] 
                                    : "bg-white border-[var(--border)] text-slate-400 hover:border-blue-300 hover:text-[var(--color-primary)] shadow-sm"
                            )}>
                            {selected.status === s && <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {s.replace(/_/g, ' ')}
                          </button>
                        ))}
                    </div>
                </div>

                {/* Analysis Intelligence Ledger */}
                <div className="space-y-6 pt-12 border-t border-[var(--border)] mb-12">
                     <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-4">
                         <MessageSquare className="h-4 w-4 text-[var(--color-primary)]" /> Knowledge Base / Logs ({selected.comments?.length || 0})
                         <div className="h-px flex-1 bg-slate-100" />
                     </h4>
                     
                     <div className="space-y-6">
                        {(selected.comments || []).length === 0 ? (
                            <div className="py-12 bg-slate-50 border border-dashed border-[var(--border)] rounded-[3px] text-center opacity-40">
                                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">No Analysis Logged</p>
                            </div>
                        ) : (
                          (selected.comments || []).map((c: any) => (
                            <div key={c.id} className="flex gap-4 group/c">
                                <div className="w-9 h-9 rounded-[3px] flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm" style={{ background: 'var(--color-primary)' }}>
                                    {c.user?.name?.[0] || '?'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{c.user?.name}</p>
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="rounded-[3px] p-4 bg-slate-50 border border-[var(--border)] group-hover/c:bg-white transition-colors">
                                        <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">{c.body}</p>
                                    </div>
                                </div>
                            </div>
                          ))
                        )}
                     </div>

                     <form onSubmit={handleComment} className="flex gap-3 pt-6 sticky bottom-0 bg-white pb-8">
                        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Append intelligence to ledger..."
                          className={cn(inputClass, "h-12")} />
                        <button type="submit" className="jira-button jira-button-primary h-12 px-6 gap-2 font-bold uppercase text-[10px] flex items-center justify-center">
                            <Send className="h-4 w-4" /> Post
                        </button>
                     </form>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
