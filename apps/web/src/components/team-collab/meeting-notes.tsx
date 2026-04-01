"use client";

import { useEffect, useState, useCallback } from 'react';
import { BookOpen, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp, Users, Calendar, CheckSquare } from 'lucide-react';
import { teamCollabApi } from '@/lib/team-collab-api';

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
        } catch { /* ignore */ }
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
        } catch { /* ignore */ }
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
        if (!confirm('Delete this meeting note?')) return;
        try {
            await teamCollabApi.deleteMeeting(teamId, id);
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch { /* ignore */ }
    };

    const f = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#1D4ED8]" />
                    <h2 className="text-sm font-semibold text-[#0F172A]">Meeting Notes</h2>
                </div>
                <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg transition">
                    <Plus className="h-3.5 w-3.5" /> New Note
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-[#0F172A]">{editingId ? 'Edit Meeting Note' : 'New Meeting Note'}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-[#64748B] mb-1 block">Meeting Title</label>
                            <input className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                                placeholder="e.g. Sprint Planning Meeting" value={form.title} onChange={f('title')} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#64748B] mb-1 block">Meeting Date</label>
                            <input type="date" className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                                value={form.meeting_date} onChange={f('meeting_date')} />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[#64748B] mb-1 block">Attendees</label>
                            <input className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                                placeholder="Names or all members" value={form.attendees} onChange={f('attendees')} />
                        </div>
                    </div>
                    {[
                        { key: 'agenda' as const, label: 'Agenda', placeholder: 'What was planned to be discussed...' },
                        { key: 'discussion' as const, label: 'Discussion Points', placeholder: 'Key points discussed...' },
                        { key: 'action_items' as const, label: 'Action Items', placeholder: 'Tasks and responsibilities assigned...' },
                        { key: 'follow_up' as const, label: 'Follow-up', placeholder: 'Next steps and follow-up tasks...' },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label className="text-xs font-medium text-[#64748B] mb-1 block">{label}</label>
                            <textarea rows={3}
                                className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none"
                                placeholder={placeholder} value={form[key]} onChange={f(key)} />
                        </div>
                    ))}
                    <div className="flex justify-end gap-2">
                        <button onClick={() => { setShowForm(false); setEditingId(null); }}
                            className="px-4 py-2 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F8FAFC] transition">Cancel</button>
                        <button onClick={handleSubmit}
                            className="px-4 py-2 bg-[#1D4ED8] text-white text-sm font-medium rounded-lg hover:bg-[#1E40AF] transition">
                            {editingId ? 'Update' : 'Save Note'}
                        </button>
                    </div>
                </div>
            )}

            {/* Notes List */}
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="h-6 w-6 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
                </div>
            ) : notes.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
                    <BookOpen className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
                    <p className="text-sm text-[#64748B]">No meeting notes yet.</p>
                    <p className="text-xs text-[#94A3B8] mt-1">Record your team meetings to keep everyone aligned.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notes.map(note => (
                        <div key={note.id} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#F8FAFC] transition"
                                onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                                        <Calendar className="h-4 w-4 text-[#1D4ED8]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#0F172A]">{note.title}</p>
                                        <p className="text-xs text-[#64748B]">
                                            {new Date(note.meeting_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            {' · '}{note.creator.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(note.creator.id === currentUser?.id || isLeader) && (
                                        <>
                                            <button onClick={e => { e.stopPropagation(); handleEdit(note); }}
                                                className="p-1.5 text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition">
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={e => { e.stopPropagation(); handleDelete(note.id); }}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    )}
                                    {expandedId === note.id ? <ChevronUp className="h-4 w-4 text-[#94A3B8]" /> : <ChevronDown className="h-4 w-4 text-[#94A3B8]" />}
                                </div>
                            </div>
                            {expandedId === note.id && (
                                <div className="px-4 pb-4 border-t border-[#F1F5F9] space-y-4 pt-4">
                                    {note.attendees && (
                                        <div>
                                            <p className="text-xs font-semibold text-[#64748B] flex items-center gap-1 mb-1">
                                                <Users className="h-3.5 w-3.5" /> Attendees
                                            </p>
                                            <p className="text-sm text-[#0F172A]">{note.attendees}</p>
                                        </div>
                                    )}
                                    {note.agenda && (
                                        <div>
                                            <p className="text-xs font-semibold text-[#64748B] mb-1">Agenda</p>
                                            <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{note.agenda}</p>
                                        </div>
                                    )}
                                    {note.discussion && (
                                        <div>
                                            <p className="text-xs font-semibold text-[#64748B] mb-1">Discussion Points</p>
                                            <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{note.discussion}</p>
                                        </div>
                                    )}
                                    {note.action_items && (
                                        <div>
                                            <p className="text-xs font-semibold text-[#64748B] flex items-center gap-1 mb-1">
                                                <CheckSquare className="h-3.5 w-3.5" /> Action Items
                                            </p>
                                            <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{note.action_items}</p>
                                        </div>
                                    )}
                                    {note.follow_up && (
                                        <div>
                                            <p className="text-xs font-semibold text-[#64748B] mb-1">Follow-up</p>
                                            <p className="text-sm text-[#0F172A] whitespace-pre-wrap">{note.follow_up}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
