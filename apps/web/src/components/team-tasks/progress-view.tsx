"use client";

import { useState } from 'react';
import { Plus, X, Loader2, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { teamTasksApi } from '@/lib/team-tasks-api';

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition";

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
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-[#0F172A]">Daily Progress Log</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">{updates.length} updates recorded</p>
                </div>
                <button onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg transition">
                    <Plus className="h-3.5 w-3.5" /> Submit Update
                </button>
            </div>

            {updates.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
                    <TrendingUp className="h-8 w-8 text-[#E2E8F0] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#0F172A]">No progress updates yet</p>
                    <p className="text-xs text-[#64748B] mt-1">Submit your first daily update to track progress.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([date, dayUpdates]) => (
                        <div key={date}>
                            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">{date}</p>
                            <div className="space-y-3">
                                {dayUpdates.map((u: any) => (
                                    <div key={u.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                                        <div className="flex items-center gap-2.5 mb-3">
                                            <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] text-xs font-bold shrink-0">
                                                {u.user?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#0F172A]">{u.user?.name}</p>
                                                <p className="text-[10px] text-[#94A3B8]">
                                                    {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <UpdateSection icon={CheckCircle2} color="text-green-600" label="Completed">
                                                {u.completed}
                                            </UpdateSection>
                                            {u.task_progress && (
                                                <UpdateSection icon={TrendingUp} color="text-blue-600" label="Task Progress">
                                                    {u.task_progress}
                                                </UpdateSection>
                                            )}
                                            {u.blockers && (
                                                <UpdateSection icon={AlertCircle} color="text-red-500" label="Blockers">
                                                    {u.blockers}
                                                </UpdateSection>
                                            )}
                                            {u.next_plan && (
                                                <UpdateSection icon={ArrowRight} color="text-purple-600" label="Plan for Tomorrow">
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

            {/* Submit form modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9]">
                            <h2 className="text-base font-bold text-[#0F172A]">Daily Progress Update</h2>
                            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition">
                                <X className="h-4 w-4 text-[#64748B]" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#0F172A]">What did you complete today? *</label>
                                <textarea className={`${inputClass} min-h-[80px] resize-none`}
                                    placeholder="Describe what you accomplished..."
                                    value={form.completed} onChange={e => setForm({ ...form, completed: e.target.value })} required />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#0F172A]">Current task progress</label>
                                <input className={inputClass} placeholder="e.g. 60% done on API integration"
                                    value={form.task_progress} onChange={e => setForm({ ...form, task_progress: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#0F172A]">Blockers or issues</label>
                                <textarea className={`${inputClass} min-h-[60px] resize-none`}
                                    placeholder="Any blockers or issues you're facing?"
                                    value={form.blockers} onChange={e => setForm({ ...form, blockers: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-[#0F172A]">Plan for tomorrow</label>
                                <textarea className={`${inputClass} min-h-[60px] resize-none`}
                                    placeholder="What will you work on next?"
                                    value={form.next_plan} onChange={e => setForm({ ...form, next_plan: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={loading}
                                    className="flex-1 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Update'}
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
        <div className="flex items-start gap-2">
            <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${color}`} />
            <div>
                <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">{label}: </span>
                <span className="text-sm text-[#0F172A]">{children}</span>
            </div>
        </div>
    );
}
