"use client";

import { useState } from 'react';
import { X, Loader2, Copy, Check, Mail } from 'lucide-react';
import { teamsApi } from '@/lib/teams-api';

export default function InviteMemberModal({
    teamId, inviteCode, onClose,
}: { teamId: string; inviteCode: string; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [email, setEmail] = useState('');
    const [copied, setCopied] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setSuccess('');
        setLoading(true);
        try {
            await teamsApi.inviteMember(teamId, email);
            setSuccess(`Invite sent to ${email}`);
            setEmail('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send invite.');
        } finally { setLoading(false); }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
                    <h2 className="text-base font-bold text-[#0F172A]">Invite Members</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
                        <X className="h-4 w-4 text-[#64748B]" />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    {/* Invite code */}
                    <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                        <p className="text-xs font-semibold text-[#64748B] mb-2">Share Invite Code</p>
                        <div className="flex items-center gap-3">
                            <code className="flex-1 text-lg font-mono font-bold text-[#1D4ED8] tracking-widest">{inviteCode}</code>
                            <button onClick={copyCode}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-[#1E40AF] transition">
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-2">Members can join using this code from the Teams page.</p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-[#E2E8F0]" />
                        <span className="text-xs text-[#94A3B8]">or invite by email</span>
                        <div className="flex-1 h-px bg-[#E2E8F0]" />
                    </div>

                    {/* Email invite */}
                    <form onSubmit={handleInvite} className="space-y-3">
                        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
                        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">{success}</div>}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                                <input type="email" placeholder="colleague@gmail.com"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                                    value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit" disabled={loading}
                                className="px-4 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center gap-2">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
                            </button>
                        </div>
                    </form>

                    <button onClick={onClose}
                        className="w-full py-2.5 border border-[#E2E8F0] text-sm font-medium text-[#64748B] rounded-lg hover:bg-[#F8FAFC] transition">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
