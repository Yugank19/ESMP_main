"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, Bug, X, Trash2, ArrowLeft, Filter, 
    ChevronRight, Save, MessageSquare, ShieldAlert,
    Terminal, Zap, Globe, AlertTriangle, CheckCircle2,
    Clock, User, Hash, MoreHorizontal, Send
} from 'lucide-react';
import { getBugs, createBug, updateBug, addBugComment, deleteBug } from '@/lib/bugs-api';
import { cn } from '@/lib/utils';

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'FIXED', 'TESTING', 'CLOSED', 'WONT_FIX'];
const ENVS = ['PRODUCTION', 'STAGING', 'DEV'];

const SEV_COLORS: Record<string, string> = { 
    LOW: 'bg-slate-100 text-slate-600 border-slate-200', 
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-100', 
    HIGH: 'bg-orange-50 text-orange-700 border-orange-100', 
    CRITICAL: 'bg-red-50 text-red-700 border-red-100' 
};

const STATUS_COLORS: Record<string, string> = { 
    OPEN: 'bg-red-50 text-red-700 border-red-100', 
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-100', 
    FIXED: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
    TESTING: 'bg-indigo-50 text-indigo-700 border-indigo-100', 
    CLOSED: 'bg-slate-100 text-slate-500 border-slate-200', 
    WONT_FIX: 'bg-slate-100 text-slate-400 border-slate-200' 
};

const inputClass = "w-full px-3 py-2 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all";

export default function BugsPage() {
  const router = useRouter();
  const [bugs, setBugs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [comment, setComment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
      title: '', description: '', severity: 'MEDIUM', priority: 'MEDIUM', 
      environment: 'DEV', steps_to_reproduce: '', expected_behavior: '', 
      actual_behavior: '' 
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { 
        const b = await getBugs(filterStatus ? { status: filterStatus } : {}); 
        setBugs(Array.isArray(b) ? b : []); 
    } catch { }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const user = JSON.parse(s);
    if ((user.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    load();
  }, [load, router]);

  async function handleDelete(id: string) {
    if (!confirm('Purge this anomaly record from the central intelligence? This action is irreversible.')) return;
    try { 
        await deleteBug(id); 
        setSelected(null); 
        load(); 
    } catch { 
        alert('Purge failure: Anomaly record is protected or unreachable.'); 
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { 
        await createBug(form); 
        setShowCreate(false); 
        setForm({ title: '', description: '', severity: 'MEDIUM', priority: 'MEDIUM', environment: 'DEV', steps_to_reproduce: '', expected_behavior: '', actual_behavior: '' });
        load(); 
    } catch (err: any) { 
        alert(err.message); 
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
        await updateBug(id, { status });
        load();
        if (selected?.id === id) setSelected((p: any) => ({ ...p, status }));
    } catch { }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !selected) return;
    try {
        const c = await addBugComment(selected.id, comment);
        setSelected((p: any) => ({ ...p, comments: [...(p.comments || []), c] }));
        setComment('');
    } catch { }
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
            <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Anomaly Tracking System</h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Central Repository for Defect Isolation and Neutralization</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="jira-button jira-button-primary h-12 px-8 gap-3 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" /> Report Anomaly
        </button>
      </div>

      {/* Modern Filter Strip */}
      <div className="flex items-center justify-between bg-[var(--bg-surface-2)] p-1.5 border border-[var(--border)] rounded-[3px]">
        <div className="flex items-center gap-1">
          <div className="px-3 py-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 border-r border-[var(--border)] mr-2">
              <Filter className="h-3 w-3" /> Status Filter
          </div>
          <button 
             onClick={() => setFilterStatus('')}
             className={cn(
               "px-4 py-2 rounded-[2px] text-[10px] font-bold uppercase tracking-widest transition-all",
               filterStatus === '' ? "bg-white text-[var(--color-primary)] shadow-sm border border-[var(--border)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
             )}
          >
            All Reports
          </button>
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn(
                "px-4 py-2 rounded-[2px] text-[10px] font-bold uppercase tracking-widest transition-all",
                filterStatus === s ? "bg-white text-[var(--color-primary)] shadow-sm border border-[var(--border)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="pr-4 hidden md:block">
             <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Active Personnel: {bugs.length} Synchronized</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="card p-0 overflow-hidden shadow-sm">
        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                  <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Synchronizing Defect Intel...</span>
             </div>
        ) : bugs.length === 0 ? (
          <div className="p-32 text-center flex flex-col items-center opacity-30">
            <ShieldAlert className="h-20 w-20 text-[var(--text-muted)] mb-6 stroke-[1px]" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Parameter Integrity Confirmed</h3>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">No active anomalies detected within current sector.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
                  {['Identifier', 'Severity', 'Anomaly Status', 'Environment', 'Reporter', 'Analysis'].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] first:pl-8">{h}</th>
                  ))}
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bugs.map(b => (
                  <tr key={b.id} onClick={() => setSelected(b)} className="group cursor-pointer hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5 first:pl-8">
                        <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-[3px] bg-slate-50 border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--color-primary)] transition-all">
                                  <Bug className="h-3.5 w-3.5 text-red-500" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-sm font-bold text-[var(--text-primary)] truncate max-w-sm">{b.title}</p>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">EST-{b.id.substring(0,6).toUpperCase()}</p>
                             </div>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                        <span className={cn("px-2 py-0.5 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", SEV_COLORS[b.severity])}>
                            {b.severity}
                        </span>
                    </td>
                    <td className="px-6 py-5">
                        <span className={cn("px-2 py-0.5 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", STATUS_COLORS[b.status])}>
                            {b.status.replace(/_/g, ' ')}
                        </span>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                             <Globe className="h-3 w-3 text-slate-300" />
                             <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">{b.environment || 'N/A'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-200">
                                 {b.reporter?.name?.[0]}
                             </div>
                             <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">{b.reporter?.name}</span>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                             <MessageSquare className="h-3.5 w-3.5 text-slate-300" />
                             <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">{b.comments?.length || 0} Logs</span>
                        </div>
                    </td>
                    <td className="px-6 py-5 text-right pr-8">
                         <ChevronRight className="h-4 w-4 ml-auto text-slate-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Anomaly Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-red-500" />
                  <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Initiate Defect Log</h2>
              </div>
              <button 
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-[3px] hover:bg-white hover:border-[var(--border)] border border-transparent transition-all"
              >
                  <X className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
              <div>
                 <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Report System Inconsistency</h3>
                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Provide comprehensive heuristics for isolation and debugging.</p>
              </div>

              <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Defect Designation (Title) *</label>
                    <input required value={form.title} placeholder="ANOMALY_IDENTIFIER_ALPHA" onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className={cn(inputClass, "uppercase")} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { field: 'severity', label: 'Threat Level (Severity)', opts: SEVERITIES },
                        { field: 'priority', label: 'Response Tier (Priority)', opts: SEVERITIES },
                        { field: 'environment', label: 'Deployment Sector (Env)', opts: ENVS }
                    ].map(({ field, label, opts }) => (
                      <div key={field} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">{label}</label>
                        <select value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                          className={cn(inputClass, "appearance-none bg-slate-50")}>
                          {opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Primary Deficiency (Description) *</label>
                        <textarea required rows={3} value={form.description} placeholder="Define the core system failure..." onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                          className={cn(inputClass, "resize-none font-medium")} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {[
                               { field: 'steps_to_reproduce', label: 'Reproduction Sequence', placeholder: '1. Execute pilot logic\n2. Trigger terminal event...' },
                               { field: 'expected_behavior', label: 'Heuristic Goal (Expected)', placeholder: 'Define intended outcome...' },
                               { field: 'actual_behavior', label: 'Actual Observation', placeholder: 'Define captured anomaly...' }
                           ].map(({ field, label, placeholder }) => (
                             <div key={field} className={cn("space-y-1.5", field === 'actual_behavior' && "md:col-span-2")}>
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">{label}</label>
                                <textarea rows={field === 'actual_behavior' ? 4 : 3} value={(form as any)[field]} placeholder={placeholder} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                  className={cn(inputClass, "resize-none font-medium bg-slate-50 border-dashed border-2")} />
                             </div>
                           ))}
                      </div>
                  </div>
              </div>

              <div className="pt-6 border-t border-[var(--border)] flex gap-4">
                <button type="submit" className="jira-button jira-button-primary h-12 flex-1 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">Broadcast Defect Log</button>
                <button type="button" onClick={() => setShowCreate(false)} className="jira-button border border-[var(--border)] h-12 flex-1 font-bold uppercase text-[10px] bg-white text-[var(--text-muted)]">Abort Transmission</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intelligent Anomaly Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-[110] flex items-start justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl h-full bg-white shadow-2xl overflow-y-auto no-scrollbar animate-in slide-in-from-right-1/2 duration-500 border-l border-[var(--border)] flex flex-col">
            {/* Drawer Header */}
            <div className="px-8 py-6 bg-[var(--bg-surface-2)] border-b border-[var(--border)] sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                     <Hash className="h-4 w-4 text-[var(--color-primary)]" />
                     <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">ANOMALY_RECORD_ID: {selected.id.substring(0,8).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => handleDelete(selected.id)} 
                      className="p-2 rounded-[3px] text-red-400 hover:text-red-700 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={() => setSelected(null)}
                        className="p-2 bg-white border border-[var(--border)] rounded-[3px] text-slate-400 hover:text-[var(--text-primary)] transition-all shadow-sm"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="p-8 space-y-12 flex-1">
                {/* Core Intel */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                         <span className={cn("px-2.5 py-1 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", SEV_COLORS[selected.severity])}>
                             {selected.severity} LEVEL
                         </span>
                         <span className={cn("px-2.5 py-1 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", STATUS_COLORS[selected.status])}>
                             STATE: {selected.status}
                         </span>
                         {selected.environment && (
                              <span className="px-2.5 py-1 text-[9px] font-extrabold border border-slate-200 bg-slate-50 text-slate-500 rounded-[2px] uppercase tracking-widest shadow-sm flex items-center gap-1.5">
                                   <Globe className="h-3 w-3" /> {selected.environment}
                              </span>
                         )}
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{selected.title}</h2>
                    <div className="flex items-center gap-6">
                         <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-[var(--color-primary)] border border-blue-100 shadow-sm">
                                 {selected.reporter?.name?.[0]}
                             </div>
                             <div>
                                 <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Reporter Identified</p>
                                 <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase">{selected.reporter?.name}</p>
                             </div>
                         </div>
                         <div className="h-8 w-px bg-slate-100" />
                         <div>
                             <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Transmission Recorded</p>
                             <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase flex items-center gap-2">
                                 <Clock className="h-3.5 w-3.5" /> {new Date(selected.created_at).toLocaleDateString()}
                             </p>
                         </div>
                    </div>
                </div>

                {/* Technical Heuristics */}
                <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                         <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                             <AlertTriangle className="h-4 w-4 text-orange-500" /> Deficiency Brief
                         </h4>
                         <div className="p-5 bg-slate-50 border border-[var(--border)] rounded-[3px] border-l-4 border-l-red-500 shadow-sm">
                             <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed">{selected.description}</p>
                         </div>
                    </div>

                    {selected.steps_to_reproduce && (
                         <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                  <Terminal className="h-4 w-4 text-slate-400" /> Reproduction Protocols
                              </h4>
                              <div className="p-5 bg-slate-900 border border-slate-800 rounded-[3px] shadow-lg">
                                  <p className="text-sm font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">{selected.steps_to_reproduce}</p>
                              </div>
                         </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selected.expected_behavior && (
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Expected Parameter</h4>
                              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-[3px] border-l-4 border-l-emerald-500">
                                  <p className="text-xs font-bold text-emerald-700 leading-relaxed font-mono uppercase tracking-tight">{selected.expected_behavior}</p>
                              </div>
                           </div>
                        )}
                        {selected.actual_behavior && (
                           <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Anomalous observation</h4>
                              <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-[3px] border-l-4 border-l-rose-500">
                                  <p className="text-xs font-bold text-rose-700 leading-relaxed font-mono uppercase tracking-tight">{selected.actual_behavior}</p>
                              </div>
                           </div>
                        )}
                    </div>
                </div>

                {/* State Transition Control */}
                <div className="space-y-4 pt-8 border-t border-[var(--border)]">
                    <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[var(--color-primary)]" /> Update Anomaly State
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {STATUSES.map(s => (
                          <button key={s} onClick={() => handleStatusChange(selected.id, s)}
                            className={cn(
                                "h-12 rounded-[3px] text-[10px] font-bold uppercase tracking-widest transition-all scale-100 active:scale-95 flex items-center justify-center border shadow-sm",
                                selected.status === s 
                                    ? "ring-4 ring-blue-100/50 outline-2 outline-[var(--color-primary)] " + STATUS_COLORS[s] 
                                    : "bg-white border-[var(--border)] text-slate-400 hover:border-blue-300 hover:text-[var(--color-primary)]"
                            )}>
                            {selected.status === s && <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {s.replace(/_/g, ' ')}
                          </button>
                        ))}
                    </div>
                </div>

                {/* Analysis Intel Ledger (Comments) */}
                <div className="space-y-6 pt-12 border-t border-[var(--border)] mb-12">
                     <h4 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-4">
                         <MessageSquare className="h-4 w-4 text-[var(--color-primary)]" /> Analysis Intel Ledger ({selected.comments?.length || 0})
                         <div className="h-px flex-1 bg-slate-100" />
                     </h4>
                     
                     <div className="space-y-6">
                        {(selected.comments || []).length === 0 ? (
                            <div className="py-12 bg-slate-50 border border-dashed border-[var(--border)] rounded-[3px] text-center opacity-40">
                                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">No Intelligence Logged</p>
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
                        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Append intelligence to log..."
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
