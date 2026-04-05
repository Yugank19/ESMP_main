"use client";

import { useState } from 'react';
import { X, Clock, User, Flag, Calendar, MessageSquare, Trash2, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { teamTasksApi } from '@/lib/team-tasks-api';
import TaskWorkflowPanel from './task-workflow-panel';

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'READY_FOR_REVIEW', 'READY_FOR_TESTING', 'APPROVED', 'DONE', 'REWORK_REQUIRED'];
const STATUS_COLORS: Record<string, string> = {
    TODO: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    READY_FOR_REVIEW: 'bg-amber-100 text-amber-700',
    READY_FOR_TESTING: 'bg-purple-100 text-purple-700',
    APPROVED: 'bg-green-100 text-green-700',
    DONE: 'bg-green-100 text-green-700',
    REWORK_REQUIRED: 'bg-red-100 text-red-700',
    REVIEW: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
};
const PRIORITY_COLORS: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-slate-100 text-slate-600',
};

export default function TaskDetailModal({ task, teamId, currentUser, isLeader, members, onClose, onUpdated, onDeleted }: {
    task: any;
    teamId: string;
    currentUser: any;
    isLeader: boolean;
    members: any[];
    onClose: () => void;
    onUpdated: (task: any) => void;
    onDeleted: (taskId: string) => void;
}) {
    const [t, setT] = useState(task);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);

    const isAssignee = t.assignees?.some((a: any) => a.user_id === currentUser?.id);
    const canEdit = isLeader || isAssignee;
    const overdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED';

    const handleStatusChange = async (status: string) => {
        setStatusLoading(true);
        try {
            const res = await teamTasksApi.updateTask(teamId, t.id, { status });
            setT(res.data);
            onUpdated(res.data);
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
        finally { setStatusLoading(false); }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            const res = await teamTasksApi.addComment(teamId, t.id, comment.trim());
            setT((prev: any) => ({ ...prev, comments: [...(prev.comments || []), res.data] }));
            setComment('');
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this task? This cannot be undone.')) return;
        try {
            await teamTasksApi.deleteTask(teamId, t.id);
            onDeleted(t.id);
            onClose();
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-[#F1F5F9]">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>
                                {t.priority}
                            </span>
                            {overdue && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                                    <AlertTriangle className="h-3.5 w-3.5" /> Overdue
                                </span>
                            )}
                            {t.status === 'COMPLETED' && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                                </span>
                            )}
                        </div>
                        <h2 className="text-base font-bold text-[#0F172A]">{t.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {isLeader && (
                            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition">
                            <X className="h-4 w-4 text-[#64748B]" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-5 space-y-5">
                        {/* Status selector */}
                        {canEdit && (
                            <div>
                                <p className="text-xs font-semibold text-[#64748B] mb-2">Status</p>
                                <div className="flex gap-2 flex-wrap">
                                    {STATUS_OPTIONS.map(s => (
                                        <button key={s}
                                            onClick={() => handleStatusChange(s)}
                                            disabled={statusLoading}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition
                                                ${t.status === s
                                                    ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]'
                                                    : 'border-[#E2E8F0] text-[#64748B] hover:border-[#1D4ED8]/40'}`}>
                                            {s.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <MetaItem icon={User} label="Assigned to">
                                {t.assignees?.length > 0
                                    ? t.assignees.map((a: any) => a.user?.name).join(', ')
                                    : 'Unassigned'}
                            </MetaItem>
                            <MetaItem icon={Calendar} label="Due date">
                                {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                            </MetaItem>
                            <MetaItem icon={Clock} label="Estimate">
                                {t.estimate_hours ? `${t.estimate_hours}h` : '—'}
                            </MetaItem>
                            <MetaItem icon={Flag} label="Created by">
                                {t.creator?.name || '—'}
                            </MetaItem>
                        </div>

                        {/* Description */}
                        {t.description && (
                            <div>
                                <p className="text-xs font-semibold text-[#64748B] mb-1.5">Description</p>
                                <p className="text-sm text-[#0F172A] leading-relaxed bg-[#F8FAFC] rounded-lg p-3">
                                    {t.description}
                                </p>
                            </div>
                        )}

                        {/* ── Enterprise Workflow Panel ── */}
                        <div>
                            <p className="text-xs font-semibold text-[#64748B] mb-2">Task Workflow</p>
                            <TaskWorkflowPanel
                                task={t}
                                currentUser={currentUser}
                                memberRole={isLeader ? 'LEADER' : 'MEMBER'}
                                onStatusChange={async () => {
                                    try {
                                        const res = await teamTasksApi.getTask(teamId, t.id);
                                        setT(res.data);
                                        onUpdated(res.data);
                                    } catch {}
                                }}
                            />
                        </div>

                        {/* History */}
                        {t.history?.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-[#64748B] mb-2">Change History</p>
                                <div className="space-y-1.5">
                                    {t.history.slice(0, 5).map((h: any) => (
                                        <div key={h.id} className="flex items-center gap-2 text-xs text-[#64748B]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] shrink-0" />
                                            <span className="font-medium text-[#0F172A]">{h.user?.name}</span>
                                            changed <span className="font-medium">{h.field}</span> from
                                            <span className="font-mono bg-[#F1F5F9] px-1 rounded">{h.old_value || '—'}</span>
                                            to
                                            <span className="font-mono bg-[#EFF6FF] text-[#1D4ED8] px-1 rounded">{h.new_value}</span>
                                            <span className="ml-auto text-[#94A3B8] shrink-0">{new Date(h.created_at).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <div>
                            <p className="text-xs font-semibold text-[#64748B] mb-3 flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Comments ({t.comments?.length || 0})
                            </p>
                            <div className="space-y-3 mb-3">
                                {t.comments?.map((c: any) => (
                                    <div key={c.id} className="flex items-start gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] text-xs font-bold shrink-0">
                                            {c.user?.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 bg-[#F8FAFC] rounded-xl px-3 py-2">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-xs font-semibold text-[#0F172A]">{c.user?.name}</span>
                                                <span className="text-[10px] text-[#94A3B8]">{new Date(c.created_at).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-[#0F172A]">{c.body}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!t.comments || t.comments.length === 0) && (
                                    <p className="text-xs text-[#94A3B8] text-center py-3">No comments yet.</p>
                                )}
                            </div>

                            {/* Add comment */}
                            <form onSubmit={handleComment} className="flex gap-2">
                                <input
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                                />
                                <button type="submit" disabled={submitting || !comment.trim()}
                                    className="px-3 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded-lg transition disabled:opacity-50">
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetaItem({ icon: Icon, label, children }: any) {
    return (
        <div className="bg-[#F8FAFC] rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3.5 w-3.5 text-[#94A3B8]" />
                <span className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm font-medium text-[#0F172A]">{children}</p>
        </div>
    );
}
