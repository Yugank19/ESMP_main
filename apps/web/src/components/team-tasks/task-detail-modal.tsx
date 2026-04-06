"use client";

import { useState } from 'react';
import { 
    X, Clock, User, Flag, Calendar, MessageSquare, Trash2, 
    Send, AlertTriangle, CheckCircle2, MoreHorizontal, 
    Link2, Eye, Share2, CornerDownRight, History, 
    Square, CheckSquare, ChevronDown, Equal
} from 'lucide-react';
import { teamTasksApi } from '@/lib/team-tasks-api';
import TaskWorkflowPanel from './task-workflow-panel';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
    TODO: 'bg-[#DFE1E6] text-[#42526E]',
    IN_PROGRESS: 'bg-[#DEEBFF] text-[#0052CC]',
    READY_FOR_REVIEW: 'bg-[#EAE6FF] text-[#403294]',
    READY_FOR_TESTING: 'bg-[#FFF0B3] text-[#172B4D]',
    APPROVED: 'bg-[#E3FCEF] text-[#006644]',
    DONE: 'bg-[#E3FCEF] text-[#006644]',
    REWORK_REQUIRED: 'bg-[#FFEBE6] text-[#BF2600]',
};

const PRIORITY_COLORS: Record<string, string> = {
    URGENT: 'bg-red-50 text-red-700',
    HIGH: 'bg-orange-50 text-orange-700',
    MEDIUM: 'bg-amber-50 text-amber-700',
    LOW: 'bg-slate-50 text-slate-600',
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
    const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');

    const isAssignee = t.assignees?.some((a: any) => a.user_id === currentUser?.id);
    const canEdit = isLeader || isAssignee;
    const overdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'COMPLETED' && t.status !== 'DONE';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#091E42]/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden max-h-[900px] border border-[var(--border)]">
                
                {/* Jira-style Top Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-white">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            <CheckSquare className="h-4 w-4 text-[var(--color-primary)]" />
                            <span>{t.team_name || 'Project'}</span>
                            <span className="text-[var(--border)]">/</span>
                            <span className="hover:underline cursor-pointer">ESMP-{t.id.slice(0, 3)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-[var(--bg-surface-2)] rounded-[3px] text-[var(--text-secondary)] transition-colors"><Link2 className="h-4 w-4" /></button>
                        <button className="p-1.5 hover:bg-[var(--bg-surface-2)] rounded-[3px] text-[var(--text-secondary)] transition-colors"><Eye className="h-4 w-4" /></button>
                        <button className="p-1.5 hover:bg-[var(--bg-surface-2)] rounded-[3px] text-[var(--text-secondary)] transition-colors"><Share2 className="h-4 w-4" /></button>
                        {isLeader && (
                            <button onClick={handleDelete} className="p-1.5 hover:bg-red-50 text-red-500 rounded-[3px] transition-colors"><Trash2 className="h-4 w-4" /></button>
                        )}
                        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />
                        <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-surface-2)] rounded-[3px] text-[var(--text-secondary)] transition-colors"><X className="h-5 w-5" /></button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Column: Details & Activity */}
                    <div className="flex-1 overflow-y-auto px-10 py-8 no-scrollbar">
                        <div className="space-y-8">
                            {/* Title */}
                            <h1 className="text-2xl font-bold text-[#172B4D] tracking-tight leading-tight">
                                {t.title}
                            </h1>

                            {/* Actions Bar */}
                            <div className="flex items-center gap-2">
                                <button className="jira-button border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] h-8 px-3 gap-1.5 font-bold uppercase text-[10px]">
                                    <Square className="h-3.5 w-3.5" /> Attach
                                </button>
                                <button className="jira-button border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] h-8 px-3 gap-1.5 font-bold uppercase text-[10px]">
                                    <CornerDownRight className="h-3.5 w-3.5" /> Link issue
                                </button>
                                <button className="jira-button border border-[var(--border)] bg-[var(--bg-surface-2)] text-[var(--text-secondary)] h-8 px-3 gap-1.5 font-bold uppercase text-[10px]">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {/* Description Section */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-[#172B4D]">Description</h3>
                                <div className="group relative">
                                    <div className="text-sm text-[#172B4D] leading-relaxed whitespace-pre-wrap min-h-[60px] p-2 -ml-2 rounded-[3px] hover:bg-[var(--bg-surface-2)] transition-colors cursor-text">
                                        {t.description || <span className="text-[var(--text-muted)] italic font-medium">Add a description...</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Workflow Panel */}
                            <div className="space-y-3 pt-4">
                                <h3 className="text-sm font-bold text-[#172B4D]">Management Workflow</h3>
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

                            {/* Activity Section */}
                            <div className="space-y-4 pt-8 pb-10">
                                <div className="flex items-center justify-between border-b border-[var(--border)]">
                                    <div className="flex gap-6">
                                        <button 
                                            onClick={() => setActiveTab('comments')}
                                            className={cn(
                                                "pb-2 text-sm font-bold transition-all relative",
                                                activeTab === 'comments' ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                            )}
                                        >
                                            Comments
                                        </button>
                                        <button 
                                            onClick={() => setActiveTab('history')}
                                            className={cn(
                                                "pb-2 text-sm font-bold transition-all relative",
                                                activeTab === 'history' ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                            )}
                                        >
                                            History
                                        </button>
                                    </div>
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-2">Sorted by Newest</span>
                                </div>

                                {activeTab === 'comments' ? (
                                    <div className="space-y-6 pt-2">
                                        {/* New Comment */}
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                {currentUser?.name?.charAt(0)}
                                            </div>
                                            <form onSubmit={handleComment} className="flex-1 space-y-3">
                                                <div className="relative border-2 border-[var(--border)] rounded-[3px] focus-within:border-[var(--color-primary)] transition-all">
                                                    <textarea
                                                        value={comment}
                                                        onChange={e => setComment(e.target.value)}
                                                        placeholder="Add a comment..."
                                                        className="w-full px-3 py-2 text-sm text-[var(--text-primary)] outline-none min-h-[80px] bg-white rounded-[3px] resize-none"
                                                    />
                                                </div>
                                                {comment.trim() && (
                                                    <div className="flex gap-2">
                                                        <button 
                                                            type="submit" 
                                                            disabled={submitting}
                                                            className="jira-button jira-button-primary h-8"
                                                        >
                                                            {submitting ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setComment('')}
                                                            className="jira-button text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] h-8"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </form>
                                        </div>

                                        {/* Comment List */}
                                        <div className="space-y-6">
                                            {(t.comments || []).slice().reverse().map((c: any) => (
                                                <div key={c.id} className="flex gap-4 group">
                                                    <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center text-[var(--color-primary)] text-[10px] font-bold shrink-0">
                                                        {c.user?.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-bold text-[#172B4D]">{c.user?.name}</span>
                                                            <span className="text-[10px] text-[var(--text-muted)] font-medium">{new Date(c.created_at).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-[#172B4D] leading-relaxed">{c.body}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 pt-2">
                                        {(t.history || []).slice().reverse().map((h: any) => (
                                            <div key={h.id} className="flex items-start gap-3">
                                                <History className="h-4 w-4 text-[var(--text-muted)] mt-0.5 shrink-0" />
                                                <div className="text-xs text-[var(--text-secondary)]">
                                                    <span className="font-bold text-[#172B4D]">{h.user?.name}</span>
                                                    {' updated the '}
                                                    <span className="font-bold text-[#172B4D] uppercase">{h.field}</span>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 bg-[var(--bg-surface-2)] rounded-[3px] text-[10px] line-through decoration-[var(--text-muted)]">{h.old_value || 'None'}</span>
                                                        <Clock className="h-3 w-3 rotate-180 text-[var(--text-muted)]" />
                                                        <span className="px-1.5 py-0.5 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-[3px] text-[10px] font-bold">{h.new_value}</span>
                                                    </div>
                                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(h.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar */}
                    <div className="w-[340px] bg-[#FAFBFC] border-l border-[var(--border)] overflow-y-auto p-6 no-scrollbar h-full">
                        <div className="space-y-8">
                            {/* Status Section */}
                            <div className="space-y-2">
                                <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status</h3>
                                <div className="relative group">
                                    <button 
                                        onClick={() => handleStatusChange(t.status)}
                                        className={cn(
                                            "flex items-center justify-between w-full px-3 py-2 rounded-[3px] transition-all border border-transparent hover:bg-[#EBECF0]",
                                            statusLoading && "opacity-50"
                                        )}
                                    >
                                        <span className={cn(
                                            "text-xs font-bold uppercase py-1 px-2.5 rounded-[3px]",
                                            STATUS_COLORS[t.status] || 'bg-slate-100 text-slate-600'
                                        )}>
                                            {t.status.replace('_', ' ')}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                                    </button>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Details</h3>
                                    
                                    <SidebarItem label="Assignee">
                                        <div className="flex items-center gap-2 group cursor-pointer p-1 -m-1 rounded-[3px] hover:bg-[#EBECF0] transition-colors">
                                            <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                                {t.assignees?.[0]?.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-xs font-medium text-[#172B4D] truncate">
                                                {t.assignees?.length > 0 ? t.assignees.map((a: any) => a.user?.name).join(', ') : 'Unassigned'}
                                            </span>
                                        </div>
                                    </SidebarItem>

                                    <SidebarItem label="Priority">
                                        <div className="flex items-center gap-2 group cursor-pointer p-1 -m-1 rounded-[3px] hover:bg-[#EBECF0] transition-colors">
                                            <span className={cn(
                                                "text-xs font-bold py-1 px-2 rounded-[3px] uppercase text-[10px]",
                                                PRIORITY_COLORS[t.priority] || 'bg-slate-50 text-slate-500'
                                            )}>
                                                {t.priority}
                                            </span>
                                        </div>
                                    </SidebarItem>

                                    <SidebarItem label="Due Date">
                                        <div className="flex items-center gap-2 p-1 -m-1 rounded-[3px] hover:bg-[#EBECF0] transition-colors cursor-pointer">
                                            <Calendar className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                                            <span className={cn("text-xs font-medium", overdue ? "text-red-600 font-bold" : "text-[#172B4D]")}>
                                                {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'None'}
                                            </span>
                                        </div>
                                    </SidebarItem>

                                    <SidebarItem label="Reporter">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[var(--bg-surface-3)] flex items-center justify-center text-[var(--text-secondary)] text-[9px] font-bold shrink-0">
                                                {t.creator?.name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="text-xs font-medium text-[#172B4D] truncate">{t.creator?.name || 'Unknown'}</span>
                                        </div>
                                    </SidebarItem>

                                    <SidebarItem label="Labels">
                                        <span className="text-xs text-[var(--text-muted)] italic font-medium">None</span>
                                    </SidebarItem>
                                </div>

                                {/* Metadata Footer */}
                                <div className="pt-6 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)] font-medium space-y-1">
                                    <p>Created {new Date(t.created_at).toLocaleString()}</p>
                                    <p>Updated {new Date(t.updated_at || t.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarItem({ label, children }: { label: string, children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-5 gap-2 items-center">
            <label className="col-span-2 text-xs font-bold text-[#42526E]">{label}</label>
            <div className="col-span-3 min-w-0">
                {children}
            </div>
        </div>
    );
}
