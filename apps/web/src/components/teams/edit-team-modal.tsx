"use client";

import { useState } from 'react';
import { X, Loader2, Settings, Shield, Globe, Lock, Save, Ban } from 'lucide-react';
import { teamsApi } from '@/lib/teams-api';
import { cn } from '@/lib/utils';

export default function EditTeamModal({
    team, onClose, onUpdated,
}: { team: any; onClose: () => void; onUpdated: (data: any) => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: team.name || '',
        description: team.description || '',
        project_name: team.project_name || '',
        purpose: team.purpose || '',
        visibility: team.visibility || 'PRIVATE',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await teamsApi.updateTeam(team.id, form);
            onUpdated(res.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Configuration failure: Could not update team data.');
        } finally { setLoading(false); }
    };

    const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase tracking-tight";
    const labelClass = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 block pl-1";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-[var(--color-primary)]" />
                        <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Mission Configuration</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-[3px] hover:bg-white hover:shadow-sm border border-transparent hover:border-[var(--border)] transition-all">
                        <X className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Intro */}
                    <div>
                         <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Modify Tactical Framework</h3>
                         <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Adjust core team parameters and visibility protocols.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-[3px] text-[10px] font-bold uppercase tracking-tight flex items-center gap-2">
                            <Ban className="h-4 w-4" /> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className={labelClass}>Team Designation *</label>
                            <input className={inputClass} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        
                        <div className="space-y-1.5 md:col-span-2">
                            <label className={labelClass}>Operational Brief (Description)</label>
                            <textarea rows={2} className={cn(inputClass, "resize-none normal-case font-medium")}
                                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>

                        <div className="space-y-1.5">
                            <label className={labelClass}>Project Identifier</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                                <input className={cn(inputClass, "pl-10")} value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className={labelClass}>Security Protocol (Visibility)</label>
                            <div className="relative">
                                {form.visibility === 'PRIVATE' ? <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" /> : <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-primary)]" />}
                                <select className={cn(inputClass, "pl-10 appearance-none")} value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}>
                                    <option value="PRIVATE">RESTRICTED (PRIVATE)</option>
                                    <option value="PUBLIC">UNRESTRICTED (PUBLIC)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <label className={labelClass}>Mission Purpose</label>
                            <textarea rows={2} className={cn(inputClass, "resize-none normal-case font-medium")}
                                value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6 border-t border-[var(--border)]">
                        <button type="button" onClick={onClose}
                            className="flex-1 h-12 border border-[var(--border)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest rounded-[3px] hover:bg-slate-50 transition-all">
                            Abort Configuration
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 h-12 bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-widest rounded-[3px] hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-blue-100">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {loading ? 'Transmitting...' : 'Apply Modifications'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
