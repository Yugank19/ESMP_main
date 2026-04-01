"use client";

import { useState } from 'react';
import { X, Loader2, LogIn } from 'lucide-react';
import { teamsApi } from '@/lib/teams-api';

export default function JoinTeamModal({ onClose, onJoined }: { onClose: () => void; onJoined: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [code, setCode] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await teamsApi.joinTeam(code.trim().toUpperCase());
            onJoined();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid invite code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
                    <h2 className="text-base font-bold text-[#0F172A]">Join a Team</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
                        <X className="h-4 w-4 text-[#64748B]" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm">{error}</div>}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0F172A]">Invite Code</label>
                        <input
                            placeholder="e.g. A3F9B2C1"
                            className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition font-mono tracking-widest uppercase text-center"
                            value={code} onChange={e => setCode(e.target.value)} required maxLength={8}
                        />
                        <p className="text-xs text-[#94A3B8]">Ask your team leader for the 8-character invite code.</p>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-[#E2E8F0] text-sm font-medium text-[#64748B] rounded-lg hover:bg-[#F8FAFC] transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || code.length < 6}
                            className="flex-1 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                            {loading ? 'Joining...' : 'Join Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
