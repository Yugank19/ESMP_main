"use client";

import { useState } from 'react';
import { Plus, Target, Calendar, CheckCircle2, Circle, Clock, Trash2, X, Loader2 } from 'lucide-react';
import { teamTasksApi } from '@/lib/team-tasks-api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    NOT_STARTED: { label: 'Not Started', color: 'bg-slate-100 text-slate-600', icon: Circle },
    ONGOING: { label: 'Ongoing', color: 'bg-blue-100 text-blue-700', icon: Clock },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition";

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
        if (!confirm('Delete this milestone?')) return;
        try {
            await teamTasksApi.deleteMilestone(teamId, milestoneId);
            onRefresh();
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="space-y-5">
            {/* Summary bar */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-[#0F172A]">Project Roadmap</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                            {completedMilestones} of {milestones.length} milestones completed
                        </p>
                    </div>
                    {isLeader && (
                        <button onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg transition">
                            <Plus className="h-3.5 w-3.5" /> Add Milestone
                        </button>
                    )}
                </div>
                <div className="w-full bg-[#F1F5F9] rounded-full h-2.5">
                    <div className="bg-[#1D4ED8] h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-[#64748B] mt-1.5">{progress}% complete</p>
            </div>

            {/* Timeline */}
            {milestones.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
                    <Target className="h-8 w-8 text-[#E2E8F0] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#0F172A]">No milestones yet</p>
                    <p className="text-xs text-[#64748B] mt-1">
                        {isLeader ? 'Create milestones to track project phases.' : 'The team leader will add milestones.'}
                    </p>
                </div>
            ) : (
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#E2E8F0]" />
                    <div className="space-y-4">
                        {milestones.map((ms, idx) => {
                            const cfg = STATUS_CONFIG[ms.status] || STATUS_CONFIG.NOT_STARTED;
                            const Icon = cfg.icon;
                            const completedTasks = ms.tasks?.filter((t: any) => t.task?.status === 'COMPLETED').length || 0;
                            const totalMsTasks = ms.tasks?.length || 0;
                            const msProgress = totalMsTasks > 0 ? Math.round((completedTasks / totalMsTasks) * 100) : 0;
                            const isOverdue = ms.target_date && new Date(ms.target_date) < new Date() && ms.status !== 'COMPLETED';

                            return (
                                <div key={ms.id} className="relative pl-12">
                                    {/* Timeline dot */}
                                    <div className={`absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 border-white shadow-sm
                                        ${ms.status === 'COMPLETED' ? 'bg-green-500' : ms.status === 'ONGOING' ? 'bg-blue-500' : 'bg-slate-300'}`} />

                                    <div className={`bg-white rounded-xl border p-4 ${isOverdue ? 'border-red-200' : 'border-[#E2E8F0]'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h4 className="text-sm font-semibold text-[#0F172A]">{ms.name}</h4>
                                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                    {isOverdue && (
                                                        <span className="text-[10px] font-semibold text-red-600">Overdue</span>
                                                    )}
                                                </div>
                                                {ms.description && (
                                                    <p className="text-xs text-[#64748B] mb-2">{ms.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                                                    {ms.start_date && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(ms.start_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {ms.target_date && (
                                                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                                                            <Clock className="h-3 w-3" />
                                                            Due {new Date(ms.target_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {totalMsTasks > 0 && (
                                                        <span>{completedTasks}/{totalMsTasks} tasks</span>
                                                    )}
                                                </div>

                                                {totalMsTasks > 0 && (
                                                    <div className="mt-2 w-full bg-[#F1F5F9] rounded-full h-1.5">
                                                        <div className="bg-[#1D4ED8] h-1.5 rounded-full transition-all"
                                                            style={{ width: `${msProgress}%` }} />
                                                    </div>
                                                )}

                                                {/* Related tasks */}
                                                {ms.tasks?.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {ms.tasks.slice(0, 4).map((mt: any) => (
                                                            <span key={mt.task_id}
                                                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                                                                    ${mt.task?.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                                                                {mt.task?.title}
                                                            </span>
                                                        ))}
                                                        {ms.tasks.length > 4 && (
                                                            <span className="text-[10px] text-[#94A3B8]">+{ms.tasks.length - 4} more</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {isLeader && (
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <select
                                                        value={ms.status}
                                                        onChange={e => handleStatusChange(ms.id, e.target.value)}
                                                        className="text-xs border border-[#E2E8F0] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]">
                                                        <option value="NOT_STARTED">Not Started</option>
                                                        <option value="ONGOING">Ongoing</option>
                                                        <option value="COMPLETED">Completed</option>
                                                    </select>
                                                    <button onClick={() => handleDelete(ms.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9]">
                            <h2 className="text-base font-bold text-[#0F172A]">Add Milestone</h2>
                            <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition">
                                <X className="h-4 w-4 text-[#64748B]" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#0F172A]">Milestone Name *</label>
                                <input className={inputClass} placeholder="e.g. Phase 1 Complete"
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#0F172A]">Description</label>
                                <textarea className={`${inputClass} min-h-[70px] resize-none`} placeholder="What does this milestone represent?"
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[#0F172A]">Start Date</label>
                                    <input type="date" className={inputClass}
                                        value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[#0F172A]">Target Date</label>
                                    <input type="date" className={inputClass}
                                        value={form.target_date} onChange={e => setForm({ ...form, target_date: e.target.value })} />
                                </div>
                            </div>
                            {tasks.length > 0 && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-[#0F172A]">Link Tasks</label>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                        {tasks.map((t: any) => {
                                            const sel = form.task_ids.includes(t.id);
                                            return (
                                                <button key={t.id} type="button"
                                                    onClick={() => setForm(f => ({
                                                        ...f,
                                                        task_ids: sel ? f.task_ids.filter(id => id !== t.id) : [...f.task_ids, t.id],
                                                    }))}
                                                    className={`text-xs px-2.5 py-1 rounded-lg border transition
                                                        ${sel ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E2E8F0] text-[#64748B]'}`}>
                                                    {t.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
