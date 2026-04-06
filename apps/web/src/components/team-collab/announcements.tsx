"use client";

import { useEffect, useState, useCallback } from 'react';
import { 
    Megaphone, Pin, Plus, Trash2, Edit2, X, Check, 
    Clock, User, Send, ShieldAlert, ChevronRight,
    PinOff, MoreHorizontal
} from 'lucide-react';
import { teamCollabApi } from '@/lib/team-collab-api';
import { cn } from '@/lib/utils';

interface Announcement {
    id: string;
    title: string;
    body: string;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    author: { id: string; name: string };
}

interface Props {
    teamId: string;
    currentUser: any;
    isLeader: boolean;
}

export default function Announcements({ teamId, currentUser, isLeader }: Props) {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ title: '', body: '', is_pinned: false });

    const load = useCallback(async () => {
        try {
            const res = await teamCollabApi.getAnnouncements(teamId);
            setAnnouncements(res.data);
        } catch { }
        finally { setLoading(false); }
    }, [teamId]);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.body.trim()) return;
        try {
            if (editingId) {
                const res = await teamCollabApi.updateAnnouncement(teamId, editingId, form);
                setAnnouncements(prev => prev.map(a => a.id === editingId ? res.data : a));
            } else {
                const res = await teamCollabApi.createAnnouncement(teamId, form);
                setAnnouncements(prev => [res.data, ...prev]);
            }
            setForm({ title: '', body: '', is_pinned: false });
            setShowForm(false);
            setEditingId(null);
        } catch { }
    };

    const handleEdit = (ann: Announcement) => {
        setForm({ title: ann.title, body: ann.body, is_pinned: ann.is_pinned });
        setEditingId(ann.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Purge this announcement from mission data?')) return;
        try {
            await teamCollabApi.deleteAnnouncement(teamId, id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch { }
    };

    const handleTogglePin = async (ann: Announcement) => {
        try {
            const res = await teamCollabApi.updateAnnouncement(teamId, ann.id, { is_pinned: !ann.is_pinned });
            setAnnouncements(prev => prev.map(a => a.id === ann.id ? res.data : a));
        } catch { }
    };

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Mission Briefings</h3>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-tight">
                        {announcements.length} critical updates broadcasted to personnel
                    </p>
                </div>
                {isLeader && (
                    <button 
                        onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', body: '', is_pinned: false }); }}
                        className="jira-button jira-button-primary gap-2 font-bold uppercase text-[10px]"
                    >
                        <Plus className="h-4 w-4" /> Issue Broadcast
                    </button>
                )}
            </div>

            {/* Content Container */}
            <div className="space-y-6">
                {/* Broadcast Form */}
                {showForm && isLeader && (
                    <div className="card p-0 border-[var(--color-primary)] shadow-sm animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                        <div className="px-6 py-3 border-b border-[var(--border)] bg-blue-50 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Send className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                                <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">
                                    {editingId ? 'Modify Briefing' : 'Configure New Broadcast'}
                                </span>
                             </div>
                             <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-[var(--color-primary)]">
                                 <X className="h-4 w-4" />
                             </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input
                                className="w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold placeholder:text-slate-300 outline-none focus:border-[var(--color-primary)] transition-all"
                                placeholder="Briefing Title identifier..."
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            />
                            <textarea
                                rows={6}
                                className="w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-medium placeholder:text-slate-300 outline-none focus:border-[var(--color-primary)] transition-all resize-none leading-relaxed"
                                placeholder="Provide comprehensive intelligence for the team..."
                                value={form.body}
                                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                            />
                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={cn(
                                        "w-5 h-5 rounded-[3px] border-2 flex items-center justify-center transition-all",
                                        form.is_pinned ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-[var(--border)] group-hover:border-[var(--color-primary)]"
                                    )}>
                                        {form.is_pinned && <Check className="h-3.5 w-3.5 text-white" />}
                                    </div>
                                    <input type="checkbox" checked={form.is_pinned}
                                        onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                                        className="hidden" />
                                    <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Mark as High Priority (Pin)</span>
                                </label>
                                <div className="flex gap-3">
                                    <button onClick={() => { setShowForm(false); setEditingId(null); }}
                                        className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-10 px-6 font-bold uppercase text-[10px]">
                                        Abort
                                    </button>
                                    <button onClick={handleSubmit}
                                        className="jira-button jira-button-primary h-10 px-8 font-bold uppercase text-[10px]">
                                        {editingId ? 'Update Feed' : 'Broadcast Now'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Announcement Feed */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                         <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mb-4" />
                         <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Synchronizing Communications...</span>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="card p-24 text-center flex flex-col items-center opacity-40">
                        <Megaphone className="h-16 w-16 text-[var(--text-muted)] mb-6 stroke-[1px]" />
                        <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Channel Silent</h3>
                        <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest leading-loose">No active briefings recorded in the mission log.</p>
                        {isLeader && (
                             <button onClick={() => setShowForm(true)} className="jira-button jira-button-primary mt-8">Initiate Sequence</button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {announcements.map(ann => (
                            <div key={ann.id}
                                className={cn(
                                    "card p-0 transition-all border group",
                                    ann.is_pinned ? "border-amber-300 bg-amber-50 shadow-sm" : "border-[var(--border)] hover:border-[var(--color-primary)]"
                                )}>
                                <div className="flex flex-col md:flex-row">
                                    {/* Content side */}
                                    <div className="flex-1 p-6">
                                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                                            {ann.is_pinned && (
                                                <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-[3px] border border-amber-200 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                                                    <ShieldAlert className="h-3 w-3" /> Mission Critical
                                                </span>
                                            )}
                                            <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{ann.title}</h3>
                                        </div>
                                        
                                        <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{ann.body}</p>
                                        
                                        <div className="flex items-center gap-6 mt-8">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                                <User className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                                                Transmitted by {ann.author.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                                <Clock className="h-3.5 w-3.5" />
                                                {new Date(ann.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action sidebar (Jira style) */}
                                    {isLeader && (
                                        <div className={cn(
                                            "md:w-16 border-t md:border-t-0 md:border-l flex md:flex-col items-center justify-center gap-2 p-3 bg-slate-50/50",
                                            ann.is_pinned ? "border-amber-200" : "border-[var(--border)]"
                                        )}>
                                            <button 
                                                onClick={() => handleTogglePin(ann)}
                                                className={cn(
                                                    "p-2.5 rounded-[3px] transition-all",
                                                    ann.is_pinned ? "text-amber-600 bg-white shadow-sm border border-amber-200" : "text-slate-400 hover:text-amber-500 hover:bg-white"
                                                )}
                                                title={ann.is_pinned ? "De-escalate" : "Escalate to Critical"}
                                            >
                                                {ann.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(ann)}
                                                className="p-2.5 text-slate-400 hover:text-[var(--color-primary)] hover:bg-white rounded-[3px] transition-all"
                                                title="Modify Briefing"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(ann.id)}
                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[3px] transition-all"
                                                title="Purge Intel"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
