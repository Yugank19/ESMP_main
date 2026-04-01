"use client";

import { useEffect, useState, useCallback } from 'react';
import { Megaphone, Pin, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { teamCollabApi } from '@/lib/team-collab-api';

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
        } catch { /* ignore */ }
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
        } catch { /* ignore */ }
    };

    const handleEdit = (ann: Announcement) => {
        setForm({ title: ann.title, body: ann.body, is_pinned: ann.is_pinned });
        setEditingId(ann.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await teamCollabApi.deleteAnnouncement(teamId, id);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch { /* ignore */ }
    };

    const handleTogglePin = async (ann: Announcement) => {
        try {
            const res = await teamCollabApi.updateAnnouncement(teamId, ann.id, { is_pinned: !ann.is_pinned });
            setAnnouncements(prev => prev.map(a => a.id === ann.id ? res.data : a));
        } catch { /* ignore */ }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-[#1D4ED8]" />
                    <h2 className="text-sm font-semibold text-[#0F172A]">Announcements</h2>
                </div>
                {isLeader && (
                    <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ title: '', body: '', is_pinned: false }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg transition">
                        <Plus className="h-3.5 w-3.5" /> New Announcement
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && isLeader && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-[#0F172A]">
                        {editingId ? 'Edit Announcement' : 'New Announcement'}
                    </h3>
                    <input
                        className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                        placeholder="Title"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                    <textarea
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none"
                        placeholder="Write your announcement..."
                        value={form.body}
                        onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    />
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.is_pinned}
                                onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                                className="rounded border-[#E2E8F0] text-[#1D4ED8]" />
                            <span className="text-xs text-[#64748B]">Pin this announcement</span>
                        </label>
                        <div className="flex gap-2">
                            <button onClick={() => { setShowForm(false); setEditingId(null); }}
                                className="px-3 py-1.5 border border-[#E2E8F0] text-sm text-[#64748B] rounded-lg hover:bg-[#F8FAFC] transition">
                                Cancel
                            </button>
                            <button onClick={handleSubmit}
                                className="px-3 py-1.5 bg-[#1D4ED8] text-white text-sm font-medium rounded-lg hover:bg-[#1E40AF] transition">
                                {editingId ? 'Update' : 'Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="h-6 w-6 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
                </div>
            ) : announcements.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
                    <Megaphone className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
                    <p className="text-sm text-[#64748B]">No announcements yet.</p>
                    {isLeader && <p className="text-xs text-[#94A3B8] mt-1">Post an announcement to keep your team informed.</p>}
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map(ann => (
                        <div key={ann.id}
                            className={`bg-white rounded-xl border p-4 ${ann.is_pinned ? 'border-amber-300 bg-amber-50' : 'border-[#E2E8F0]'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {ann.is_pinned && (
                                            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                <Pin className="h-2.5 w-2.5" /> Pinned
                                            </span>
                                        )}
                                        <h3 className="text-sm font-semibold text-[#0F172A]">{ann.title}</h3>
                                    </div>
                                    <p className="text-xs text-[#64748B] mt-0.5">
                                        {ann.author.name} · {new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                {isLeader && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => handleTogglePin(ann)}
                                            className={`p-1.5 rounded-lg transition ${ann.is_pinned ? 'text-amber-600 bg-amber-100' : 'text-[#94A3B8] hover:bg-[#F1F5F9]'}`}>
                                            <Pin className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => handleEdit(ann)}
                                            className="p-1.5 text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition">
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(ann.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-[#374151] mt-3 whitespace-pre-wrap leading-relaxed">{ann.body}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
