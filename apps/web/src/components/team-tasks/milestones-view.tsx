"use client";

import { useState } from 'react';
import { 
    Plus, Target, Calendar, CheckCircle2, Circle, Clock, 
    Trash2, X, Loader2, ChevronRight, MoreHorizontal, 
    Link2, AlertCircle, MapPin
} from 'lucide-react';
import { teamTasksApi } from '@/lib/team-tasks-api';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    NOT_STARTED: { label: 'Not Started', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-300' },
    ONGOING: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
};

const inputClass = "w-full px-3 py-2 bg-white border border-[var(--border)] rounded-[3px] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] outline-none transition-all font-medium";

export default function MilestonesView({ teamId, milestones, tasks, isLeader, onRefresh }: {
    teamId: string;
    milestones: any[];
    tasks: any[];
    isLeader: boolean;
    onRefresh: () => void;
}) {
    const [showCreate, setShowCreate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', start_date: '', target_date: '', task_ids: [] as string[] });

    const totalTasks = milestones.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);
    const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
    const progress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await teamTasksApi.createMilestone(teamId, {
                ...form,
                start_date: form.start_date || undefined,
                target_date: form.target_date || undefined,
            });
            setShowCreate(false);
            setForm({ name: '', description: '', start_date: '', target_date: '', task_ids: [] });
            onRefresh();
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
        finally { setLoading(false); }
    };

    const handleStatusChange = async (milestoneId: string, status: string) => {
        try {
            await teamTasksApi.updateMilestone(teamId, milestoneId, { status });
            onRefresh();
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (milestoneId: string) => {
        if (!confirm('Delete this milestone? This action is irreversible.')) return;
        try {
            await teamTasksApi.deleteMilestone(teamId, milestoneId);
            onRefresh();
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
            {/* Project Roadmap Header */}
            <div className="card p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Strategic Roadmap</h3>
                        <p className="text-xs text-[var(--text-muted)] font-bold mt-1 uppercase tracking-tight">
                            {completedMilestones} of {milestones.length} milestones successfully deployed
                        </p>
                    </div>
                    {isLeader && (
                        <button onClick={() => setShowCreate(true)}
                            className="jira-button jira-button-primary gap-2 font-bold uppercase text-[10px]">
                            <Plus className="h-4 w-4" /> Create Milestone
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    <div className="w-full bg-[var(--bg-surface-3)] rounded-full h-2.5 overflow-hidden">
                        <div className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        <span>Initiation</span>
                        <span>{progress}% Delivery Progress</span>
                        <span>Completion</span>
                    </div>
                </div>
            </div>

            {/* Timeline Content */}
            {milestones.length === 0 ? (
                <div className="card p-24 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[3px] bg-blue-50 flex items-center justify-center mb-6">
                        <MapPin className="h-8 w-8 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Roadmap is currently empty</h3>
                    <p className="text-[var(--text-secondary)] mt-2 max-w-sm">
                        {isLeader ? 'Define your key project phases and milestones to visualize project trajectory.' : 'The team leader has not yet established project milestones.'}
                    </p>
                    {isLeader && (
                        <button onClick={() => setShowCreate(true)} className="jira-button jira-button-primary mt-8">Establishing Phase 1</button>
                    )}
                </div>
            ) : (
                <div className="relative pl-4">
                    {/* Main vertical line */}
                    <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-[var(--border)]" />
                    
                    <div className="space-y-10">
                        {milestones.sort((a,b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime()).map((ms, idx) => {
                            const cfg = STATUS_CONFIG[ms.status] || STATUS_CONFIG.NOT_STARTED;
                            const completedTasks = ms.tasks?.filter((t: any) => t.task?.status === 'DONE' || t.task?.status === 'APPROVED').length || 0;
                            const totalMsTasks = ms.tasks?.length || 0;
                            const msProgress = totalMsTasks > 0 ? Math.round((completedTasks / totalMsTasks) * 100) : 0;
                            const isOverdue = ms.target_date && new Date(ms.target_date) < new Date() && ms.status !== 'COMPLETED';

                            return (
                                <div key={ms.id} className="relative pl-12 group">
                                    {/* Milestone Dot on line */}
                                    <div className={cn(
                                        "absolute left-[5px] top-4 w-[6px] h-6 rounded-full border-2 border-white z-10 transition-all",
                                        cfg.dot
                                    )} />
                                    
                                    <div className={cn(
                                        "card p-0 transition-all border group-hover:border-[var(--color-primary)]",
                                        isOverdue ? 'border-red-200 shadow-sm shadow-red-50' : 'border-[var(--border)]'
                                    )}>
                                        <div className="flex flex-col md:flex-row md:items-stretch">
                                            <div className="flex-1 p-6">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <span className={cn(
                                                        "text-[9px] font-bold px-2 py-0.5 rounded-[3px] border uppercase tracking-tighter",
                                                        cfg.color
                                                    )}>
                                                        {cfg.label}
                                                    </span>
                                                    {isOverdue && (
                                                        <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-[3px] uppercase tracking-tighter flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" /> Critical Delay
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{ms.name}</h4>
                                                {ms.description && (
                                                    <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed max-w-2xl">{ms.description}</p>
                                                )}
                                                
                                                <div className="flex items-center gap-6 mt-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {ms.start_date ? new Date(ms.start_date).toLocaleDateString() : 'N/A'} — {ms.target_date ? new Date(ms.target_date).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                                        <Target className="h-3.5 w-3.5" />
                                                        {totalMsTasks} Linked Requirements
                                                    </div>
                                                </div>

                                                {/* Milestone progress tiny bar */}
                                                {totalMsTasks > 0 && (
                                                    <div className="mt-6 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] uppercase">
                                                            <span>Milestone Velocity</span>
                                                            <span className={cn(msProgress === 100 ? "text-emerald-600" : "text-[var(--color-primary)]")}>{msProgress}%</span>
                                                        </div>
                                                        <div className="w-full bg-[var(--bg-surface-3)] rounded-full h-1.5 flex overflow-hidden">
                                                            <div 
                                                                className={cn("h-full transition-all duration-700", msProgress === 100 ? "bg-emerald-500" : "bg-[var(--color-primary)]")}
                                                                style={{ width: `${msProgress}%` }} 
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right sidebar of milestone card */}
                                            <div className="md:w-64 bg-slate-50 border-l border-[var(--border)] p-6 space-y-4">
                                                {isLeader ? (
                                                    <div className="space-y-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Update Phase</label>
                                                            <div className="relative">
                                                                <select 
                                                                    value={ms.status}
                                                                    onChange={e => handleStatusChange(ms.id, e.target.value)}
                                                                    className="w-full appearance-none bg-white border border-[var(--border)] rounded-[3px] pl-3 pr-8 py-1.5 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] cursor-pointer"
                                                                >
                                                                    <option value="NOT_STARTED">Not Started</option>
                                                                    <option value="ONGOING">In Progress</option>
                                                                    <option value="COMPLETED">Completed</option>
                                                                </select>
                                                                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] rotate-90" />
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDelete(ms.id)}
                                                            className="w-full jira-button bg-white border border-red-100 text-red-600 hover:bg-red-50 h-8 gap-2 font-bold uppercase text-[10px]"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" /> Decommission
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col justify-center">
                                                        <div className="text-center p-3 border border-dashed border-[var(--border)] rounded-[3px]">
                                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Operational Phase</p>
                                                            <p className="text-xs font-bold text-[var(--text-primary)] mt-1">{cfg.label}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Create Milestone Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#091E42]/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-lg border border-[var(--border)] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Configure Phase Milestone</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-[3px] hover:bg-white transition-colors">
                                <X className="h-4 w-4 text-[var(--text-muted)]" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Milestone Name</label>
                                <input className={inputClass} placeholder="e.g. ALPHA_RELEASE_01"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Strategic Description</label>
                                <textarea className={cn(inputClass, "min-h-[100px] resize-none")} placeholder="Define terminal objectives for this phase..."
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Initiation Date</label>
                                    <input type="date" className={inputClass}
                                        value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Target Delivery</label>
                                    <input type="date" className={inputClass}
                                        value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-4 mt-6">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 jira-button bg-white border border-[var(--border)] text-[var(--text-secondary)]">
                                    Abort
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 jira-button jira-button-primary">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Establish Phase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
