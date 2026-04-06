"use client";

import { useState } from 'react';
import { 
    Plus, X, Loader2, TrendingUp, AlertCircle, 
    CheckCircle2, ArrowRight, Clock, LayoutList,
    History, ShieldCheck, ChevronRight
} from 'lucide-react';
import { teamTasksApi } from '@/lib/team-tasks-api';
import { cn } from '@/lib/utils';

const inputClass = "w-full px-3 py-2 bg-white border border-[var(--border)] rounded-[3px] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] outline-none transition-all font-medium";

export default function ProgressView({ teamId, updates, isLeader, onRefresh }: {
    teamId: string;
    updates: any[];
    isLeader: boolean;
    onRefresh: () => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ completed: '', task_progress: '', blockers: '', next_plan: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await teamTasksApi.submitProgress(teamId, form);
            setShowForm(false);
            setForm({ completed: '', task_progress: '', blockers: '', next_plan: '' });
            onRefresh();
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    // Group by date
    const grouped = updates.reduce((acc: Record<string, any[]>, u) => {
        const date = new Date(u.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if (!acc[date]) acc[date] = [];
        acc[date].push(u);
        return acc;
    }, {});

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
            {/* Progress Log Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Operational Timeline</h3>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-tight">
                        {updates.length} validated status reports recorded
                    </p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="jira-button jira-button-primary gap-2 font-bold uppercase text-[10px]">
                    <Plus className="h-4 w-4" /> Submit Status Report
                </button>
            </div>

            {/* Timeline Stream */}
            {updates.length === 0 ? (
                <div className="card p-24 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[3px] bg-blue-50 flex items-center justify-center mb-6">
                        <TrendingUp className="h-8 w-8 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Timeline is currently silent</h3>
                    <p className="text-[var(--text-secondary)] mt-2 max-w-sm font-medium">
                        Log your first daily mission update to begin tracking project evolution and team velocity.
                    </p>
                    <button onClick={() => setShowForm(true)} className="jira-button jira-button-primary mt-8 uppercase text-[10px]">Initialize First Report</button>
                </div>
            ) : (
                <div className="space-y-10 relative">
                    {/* Vertical line through grouped dates */}
                    <div className="absolute left-6 top-8 bottom-0 w-[1px] bg-[var(--border)] hidden sm:block" />

                    {Object.entries(grouped).map(([date, dayUpdates]) => (
                        <div key={date} className="relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-6 bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-[3px] hidden sm:flex items-center justify-center">
                                     <History className="h-3 w-3 text-[var(--text-muted)]" />
                                </div>
                                <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest bg-white pr-4">{date}</p>
                            </div>

                            <div className="space-y-4 pl-0 sm:pl-16">
                                {dayUpdates.map((u: any) => (
                                    <div key={u.id} className="card p-0 transition-all border group hover:border-[var(--color-primary)]">
                                        <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold border border-blue-100">
                                                    {u.user?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">{u.user?.name}</p>
                                                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <ShieldCheck className="h-4 w-4 text-emerald-500 opacity-40" />
                                        </div>

                                        <div className="p-6 space-y-4">
                                            <UpdateSection icon={CheckCircle2} color="text-emerald-500" label="Completed Objectives">
                                                {u.completed}
                                            </UpdateSection>
                                            
                                            {u.task_progress && (
                                                <UpdateSection icon={TrendingUp} color="text-indigo-500" label="Current Trajectory">
                                                    {u.task_progress}
                                                </UpdateSection>
                                            )}
                                            
                                            {u.blockers && (
                                                <div className="p-3 bg-red-50 border border-red-100 rounded-[3px]">
                                                    <UpdateSection icon={AlertCircle} color="text-red-600" label="Critical Blockers">
                                                        {u.blockers}
                                                    </UpdateSection>
                                                </div>
                                            )}
                                            
                                            {u.next_plan && (
                                                <UpdateSection icon={ChevronRight} color="text-blue-500" label="Next Phase Engagement">
                                                    {u.next_plan}
                                                </UpdateSection>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Submit Status Report Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#091E42]/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-lg border border-[var(--border)] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Operational Status Report</h2>
                            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-[3px] hover:bg-white transition-colors">
                                <X className="h-4 w-4 text-[var(--text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Completed Objectives *</label>
                                <textarea className={cn(inputClass, "min-h-[100px] resize-none")}
                                    placeholder="What primary objectives were met today?"
                                    value={form.completed} onChange={e => setForm({ ...form, completed: e.target.value })} required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Phase Trajectory</label>
                                <input className={inputClass} placeholder="e.g. 75% engagement on primary endpoint integration"
                                    value={form.task_progress} onChange={e => setForm({ ...form, task_progress: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Interference / Blockers</label>
                                <textarea className={cn(inputClass, "min-h-[70px] resize-none")}
                                    placeholder="Identify any blockers or system interference..."
                                    value={form.blockers} onChange={e => setForm({ ...form, blockers: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Next Phase Engagement</label>
                                <textarea className={cn(inputClass, "min-h-[70px] resize-none")}
                                    placeholder="What objectives are prioritized for the next cycle?"
                                    value={form.next_plan} onChange={e => setForm({ ...form, next_plan: e.target.value })} />
                            </div>
                            
                            <div className="flex gap-4 pt-4 mt-6">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 jira-button bg-white border border-[var(--border)] text-[var(--text-secondary)]">
                                    Abort
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 jira-button jira-button-primary">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function UpdateSection({ icon: Icon, color, label, children }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className={cn("mt-0.5 p-1 rounded-sm", color.replace('text-', 'bg-').concat('/10'))}>
                <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
            </div>
            <div className="flex-1">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">{label}</span>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed font-medium">{children}</p>
            </div>
        </div>
    );
}
