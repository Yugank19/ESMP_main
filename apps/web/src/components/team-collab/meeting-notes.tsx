"use client";

import { useEffect, useState, useCallback } from 'react';
import { 
    BookOpen, Plus, Trash2, Edit2, X, ChevronDown, 
    ChevronUp, Users, Calendar, CheckSquare, Clock, 
    LayoutList, ArrowRight, ShieldCheck, FileText,
    History, MessageSquare, ClipboardList
} from 'lucide-react';
import { teamCollabApi } from '@/lib/team-collab-api';
import { cn } from '@/lib/utils';

interface MeetingNote {
    id: string;
    title: string;
    meeting_date: string;
    agenda?: string;
    attendees?: string;
    discussion?: string;
    action_items?: string;
    follow_up?: string;
    created_at: string;
    creator: { id: string; name: string };
}

interface Props {
    teamId: string;
    currentUser: any;
    isLeader: boolean;
    members: any[];
}

const emptyForm = {
    title: '', meeting_date: '', agenda: '', attendees: '',
    discussion: '', action_items: '', follow_up: '',
};

const inputClass = "w-full px-3 py-2 bg-white border border-[var(--border)] rounded-[3px] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--color-primary)] outline-none transition-all font-medium";

export default function MeetingNotes({ teamId, currentUser, isLeader, members }: Props) {
    const [notes, setNotes] = useState<MeetingNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await teamCollabApi.getMeetings(teamId);
            setNotes(res.data);
        } catch { }
        finally { setLoading(false); }
    }, [teamId]);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.meeting_date) return;
        try {
            if (editingId) {
                const res = await teamCollabApi.updateMeeting(teamId, editingId, form);
                setNotes(prev => prev.map(n => n.id === editingId ? res.data : n));
            } else {
                const res = await teamCollabApi.createMeeting(teamId, form);
                setNotes(prev => [res.data, ...prev]);
            }
            setForm(emptyForm);
            setShowForm(false);
            setEditingId(null);
        } catch { }
    };

    const handleEdit = (note: MeetingNote) => {
        setForm({
            title: note.title,
            meeting_date: note.meeting_date.split('T')[0],
            agenda: note.agenda || '',
            attendees: note.attendees || '',
            discussion: note.discussion || '',
            action_items: note.action_items || '',
            follow_up: note.follow_up || '',
        });
        setEditingId(note.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Purge this meeting record from the repository?')) return;
        try {
            await teamCollabApi.deleteMeeting(teamId, id);
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch { }
    };

    const f = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }));

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Strategic Summits</h3>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-tight">
                        {notes.length} comprehensive meeting records in terminal log
                    </p>
                </div>
                <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}
                    className="jira-button jira-button-primary gap-2 font-bold uppercase text-[10px]">
                    <Plus className="h-4 w-4" /> Log Meeting Discovery
                </button>
            </div>

            {/* Note Entry Form */}
            {showForm && (
                <div className="card p-0 border-[var(--color-primary)] shadow-sm animate-in slide-in-from-top-4 duration-300 overflow-hidden">
                    <div className="px-6 py-3 border-b border-[var(--border)] bg-blue-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                            <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">
                                {editingId ? 'Modify Discovery Record' : 'Initialize Meeting Discovery'}
                            </span>
                        </div>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-[var(--color-primary)]">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Summit Title</label>
                                <input className={inputClass}
                                    placeholder="e.g. SPRINT_PLANNING_TRANSCRIPT_ALPHA" value={form.title} onChange={f('title')} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Meeting Date</label>
                                <input type="date" className={inputClass}
                                    value={form.meeting_date} onChange={f('meeting_date')} />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Personnel Present (Attendees)</label>
                                <input className={inputClass}
                                    placeholder="Identifiers or ALL_HANDS" value={form.attendees} onChange={f('attendees')} />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { key: 'agenda' as const, label: 'Operational Agenda', placeholder: 'Objectives scheduled for discovery...' },
                                { key: 'discussion' as const, label: 'Discussion Artifacts', placeholder: 'Critical dialogue points captured...' },
                                { key: 'action_items' as const, label: 'Terminal Action Items', placeholder: 'Directives assigned to personnel...' },
                                { key: 'follow_up' as const, label: 'Next-Phase Follow-up', placeholder: 'Sequential objectives and status checks...' },
                            ].map(({ key, label, placeholder }) => (
                                <div key={key}>
                                    <label className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">{label}</label>
                                    <textarea rows={4}
                                        className={cn(inputClass, "resize-none leading-relaxed transition-all")}
                                        placeholder={placeholder} value={form[key]} onChange={f(key)} />
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                            <button onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-10 px-6 font-bold uppercase text-[10px]">
                                Abort Discovery
                            </button>
                            <button onClick={handleSubmit}
                                className="jira-button jira-button-primary h-10 px-8 font-bold uppercase text-[10px]">
                                {editingId ? 'Update Record' : 'Finalize Log'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Records Stream */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                     <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin mb-4" />
                     <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Retrieving Summit History...</span>
                </div>
            ) : notes.length === 0 ? (
                <div className="card p-24 text-center flex flex-col items-center opacity-40">
                    <BookOpen className="h-16 w-16 text-[var(--text-muted)] mb-6 stroke-[1px]" />
                    <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Discovery Log Empty</h3>
                    <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest leading-loose">No summit transcripts recorded for this operation.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notes.map(note => (
                        <div key={note.id} className={cn(
                            "card p-0 transition-all border overflow-hidden",
                            expandedId === note.id ? "border-[var(--color-primary)] shadow-sm" : "border-[var(--border)] hover:border-slate-300"
                        )}>
                            <div className={cn(
                                "flex items-center justify-between px-6 py-4 cursor-pointer transition-colors",
                                expandedId === note.id ? "bg-blue-50/30" : "bg-white hover:bg-slate-50/50"
                            )}
                                onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}>
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-[3px] flex items-center justify-center shrink-0 border transition-all",
                                        expandedId === note.id ? "bg-[var(--color-primary)] border-[var(--color-primary)] shadow-sm" : "bg-white border-[var(--border)]"
                                    )}>
                                        <Calendar className={cn("h-4.5 w-4.5", expandedId === note.id ? "text-white" : "text-[var(--color-primary)]")} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{note.title}</h4>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                            <History className="h-3 w-3" />
                                            {new Date(note.meeting_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            <span className="opacity-30">·</span>
                                            Logged by {note.creator.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {(note.creator.id === currentUser?.id || isLeader) && (
                                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
                                            <button onClick={e => { e.stopPropagation(); handleEdit(note); }}
                                                className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-white rounded-[3px] transition-all">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                                                className="p-2 text-[var(--text-muted)] hover:text-red-600 hover:bg-white rounded-[3px] transition-all">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="w-8 h-8 rounded-[3px] flex items-center justify-center bg-slate-100 text-slate-400 group-hover:text-[var(--color-primary)] transition-all">
                                        {expandedId === note.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                </div>
                            </div>
                            
                            {expandedId === note.id && (
                                <div className="px-6 pb-8 pt-6 border-t border-[var(--border)] bg-white animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                        {note.attendees && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <Users className="h-3.5 w-3.5 text-[var(--color-primary)]" /> Personnel Present
                                                </p>
                                                <div className="p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                                                    <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">{note.attendees}</p>
                                                </div>
                                            </div>
                                        )}
                                        {note.agenda && (
                                            <NoteSection icon={LayoutList} label="Discovery Agenda" body={note.agenda} />
                                        )}
                                        {note.discussion && (
                                            <div className="md:col-span-2">
                                                <NoteSection icon={MessageSquare} label="Intelligence Discussion" body={note.discussion} color="text-indigo-500" />
                                            </div>
                                        )}
                                        {note.action_items && (
                                            <NoteSection icon={CheckSquare} label="Terminal Action Directives" body={note.action_items} color="text-emerald-500" />
                                        )}
                                        {note.follow_up && (
                                            <NoteSection icon={ArrowRight} label="Sequential Engagement" body={note.follow_up} color="text-blue-500" />
                                        )}
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                                         <div className="flex items-center gap-2 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                             <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 opacity-40" /> Verified Discovery Transcript
                                         </div>
                                         <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Record ID: {note.id.substring(0,8).toUpperCase()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function NoteSection({ icon: Icon, label, body, color = "text-[var(--color-primary)]" }: { icon: any, label: string, body: string, color?: string }) {
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                <Icon className={cn("h-3.5 w-3.5", color)} /> {label}
            </p>
            <div className="p-4 bg-white border border-[var(--border)] rounded-[3px] border-l-4 transition-all hover:shadow-sm" style={{ borderLeftColor: 'currentColor' }}>
                <p className="text-sm font-medium text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">{body}</p>
            </div>
        </div>
    );
}
