"use client";

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { teamTasksApi } from '@/lib/team-tasks-api';

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition";

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
        } catch (e: any) { alert(e.response?.data?.message || 'Failed to create task'); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9]">
                    <h2 className="text-base font-bold text-[#0F172A]">Create Task</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition">
                        <X className="h-4 w-4 text-[#64748B]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#0F172A]">Task Title *</label>
                        <input className={inputClass} placeholder="Enter task title"
                            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#0F172A]">Description</label>
                        <textarea className={`${inputClass} min-h-[80px] resize-none`} placeholder="Describe the task..."
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#0F172A]">Priority</label>
                            <select className={inputClass} value={form.priority}
                                onChange={e => setForm({ ...form, priority: e.target.value })}>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#0F172A]">Estimate (hours)</label>
                            <input type="number" min="0" step="0.5" className={inputClass} placeholder="e.g. 4"
                                value={form.estimate_hours} onChange={e => setForm({ ...form, estimate_hours: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#0F172A]">Start Date</label>
                            <input type="date" className={inputClass}
                                value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#0F172A]">Due Date</label>
                            <input type="date" className={inputClass}
                                value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                        </div>
                    </div>

                    {/* Assignees */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#0F172A]">Assign Members</label>
                        <div className="flex flex-wrap gap-2">
                            {members.map((m: any) => {
                                const selected = form.assignee_ids.includes(m.user_id);
                                return (
                                    <button key={m.user_id} type="button"
                                        onClick={() => toggleAssignee(m.user_id)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition
                                            ${selected ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E2E8F0] text-[#64748B] hover:border-[#1D4ED8]/40'}`}>
                                        <div className="w-4 h-4 rounded-full bg-[#1D4ED8]/10 flex items-center justify-center text-[#1D4ED8] text-[9px] font-bold">
                                            {m.user?.name?.charAt(0)}
                                        </div>
                                        {m.user?.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
