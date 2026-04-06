"use client";

import { useState } from 'react';
import { X, Loader2, Plus, Target, Calendar, Clock, UserPlus, ShieldCheck, Zap, LayoutList, ChevronRight } from 'lucide-react';
import { teamTasksApi } from '@/lib/team-tasks-api';
import { cn } from '@/lib/utils';

const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase tracking-tight";
const labelClass = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 block pl-1";

export default function CreateTaskModal({ teamId, members, onClose, onCreated }: {
    teamId: string;
    members: any[];
    onClose: () => void;
    onCreated: (task: any) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', priority: 'MEDIUM',
        start_date: '', due_date: '', estimate_hours: '',
        assignee_ids: [] as string[],
    });

    const toggleAssignee = (uid: string) => {
        setForm(f => ({
            ...f,
            assignee_ids: f.assignee_ids.includes(uid)
                ? f.assignee_ids.filter(id => id !== uid)
                : [...f.assignee_ids, uid],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        setLoading(true);
        try {
            const res = await teamTasksApi.createTask(teamId, {
                ...form,
                estimate_hours: form.estimate_hours ? parseFloat(form.estimate_hours) : undefined,
                start_date: form.start_date || undefined,
                due_date: form.due_date || undefined,
            });
            onCreated(res.data);
            onClose();
        } catch (e: any) { 
            alert(e.response?.data?.message || 'Uplink failure: Task initialization aborted.'); 
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)] shrink-0">
                    <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-[var(--color-primary)]" />
                        <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Objective Initialization</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-[3px] hover:bg-white hover:shadow-sm border border-transparent hover:border-[var(--border)] transition-all">
                        <X className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
                    {/* Mission Intro */}
                    <div>
                         <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Configure New Tactical Objective</h3>
                         <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Define parameters for mission assignment and execution.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className={labelClass}>Objective Title *</label>
                            <input className={inputClass} placeholder="ENTER_TASK_IDENTIFIER"
                                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus />
                        </div>

                        <div className="space-y-1.5">
                            <label className={labelClass}>Operational Intelligence (Description)</label>
                            <textarea className={cn(inputClass, "min-h-[120px] resize-none normal-case font-medium leading-relaxed")} 
                                placeholder="Provide comprehensive details regarding this objective..."
                                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Priority Protocols</label>
                                <div className="relative">
                                    <Zap className={cn(
                                        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4",
                                        form.priority === 'URGENT' ? "text-red-500" : form.priority === 'HIGH' ? "text-orange-500" : "text-blue-500"
                                    )} />
                                    <select className={cn(inputClass, "pl-10 appearance-none")} value={form.priority}
                                        onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        <option value="LOW">LOW_PRIORITY</option>
                                        <option value="MEDIUM">STANDARD_PRIORITY</option>
                                        <option value="HIGH">HIGH_PRIORITY</option>
                                        <option value="URGENT">URGENT_RESPONSE</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Time Allocation (Hours)</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                    <input type="number" min="0" step="0.5" className={cn(inputClass, "pl-10")} placeholder="e.g. 8.0"
                                        value={form.estimate_hours} onChange={e => setForm({ ...form, estimate_hours: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Start Sequence</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                    <input type="date" className={cn(inputClass, "pl-10")}
                                        value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Termination Deadline</label>
                                <div className="relative">
                                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                                    <input type="date" className={cn(inputClass, "pl-10 border-red-100 focus:border-red-500")}
                                        value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Assignees */}
                        <div className="space-y-3">
                            <label className={labelClass}>Operational Force (Personnel)</label>
                            <div className="p-4 bg-slate-50 border border-[var(--border)] rounded-[3px] flex flex-wrap gap-2">
                                {members.length === 0 ? (
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic py-2">No active personnel detected in sector.</p>
                                ) : (
                                    members.map((m: any) => {
                                        const selected = form.assignee_ids.includes(m.user_id);
                                        return (
                                            <button key={m.user_id} type="button"
                                                onClick={() => toggleAssignee(m.user_id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 rounded-[3px] border text-[10px] font-bold uppercase tracking-tight transition-all",
                                                    selected 
                                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-md shadow-blue-100" 
                                                        : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-blue-300"
                                                )}>
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                                                    selected ? "bg-white/20 text-white" : "bg-blue-50 text-[var(--color-primary)]"
                                                )}>
                                                    {m.user?.name?.charAt(0)}
                                                </div>
                                                {m.user?.name}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                         <ShieldCheck className="h-4 w-4 text-emerald-500 opacity-60" />
                         <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Awaiting Authorization</span>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose}
                            className="h-12 px-8 border border-[var(--border)] bg-white text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest rounded-[3px] hover:bg-slate-50 transition-all">
                            Abort Sequence
                        </button>
                        <button type="submit" onClick={handleSubmit} disabled={loading}
                            className="h-12 px-10 bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-widest rounded-[3px] hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-blue-100">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutList className="h-4 w-4" />}
                            {loading ? 'Transmitting...' : 'Register Objective'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
