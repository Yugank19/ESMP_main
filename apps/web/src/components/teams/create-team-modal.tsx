"use client";

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { teamsApi } from '@/lib/teams-api';

export default function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: (team: any) => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '', description: '', project_name: '', purpose: '', visibility: 'PRIVATE',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await teamsApi.createTeam(form);
            onCreated(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create team.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
                    <h2 className="text-base font-bold text-[#0F172A]">Create New Team</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
                        <X className="h-4 w-4 text-[#64748B]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">{error}</div>}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0F172A]">Team Name *</label>
                        <input placeholder="e.g. Frontend Squad" className={inputClass} required
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0F172A]">Description</label>
                        <textarea placeholder="What does this team do?" rows={2}
                            className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition resize-none"
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#0F172A]">Project Name</label>
                            <input placeholder="Associated project" className={inputClass}
                                value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#0F172A]">Visibility</label>
                            <select className={inputClass} value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
                                <option value="PRIVATE">Private</option>
                                <option value="PUBLIC">Public</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0F172A]">Purpose</label>
                        <textarea placeholder="What is the goal of this team?" rows={2}
                            className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition resize-none"
                            value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-[#E2E8F0] text-sm font-medium text-[#64748B] rounded-lg hover:bg-[#F8FAFC] transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading ? 'Creating...' : 'Create Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
