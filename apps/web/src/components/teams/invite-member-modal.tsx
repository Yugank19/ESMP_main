"use client";

import { useState } from 'react';
import { X, Loader2, Copy, Check, Mail, ShieldCheck, UserPlus, Globe, Zap } from 'lucide-react';
import { teamsApi } from '@/lib/teams-api';
import { cn } from '@/lib/utils';

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
            setSuccess(`Transmission successful: Invite sent to ${email}`);
            setEmail('');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Uplink failure: Could not transmit invite.');
        } finally { setLoading(false); }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-[var(--color-primary)]" />
                        <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Personnel Acquisition</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-[3px] hover:bg-white hover:shadow-sm border border-transparent hover:border-[var(--border)] transition-all">
                        <X className="h-4 w-4 text-[var(--text-muted)]" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Mission Intro */}
                    <div>
                         <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Expand the Mission Force</h3>
                         <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Authorized personnel recruitment protocols enabled.</p>
                    </div>

                    {/* Invite code */}
                    <div className="bg-slate-50 rounded-[3px] p-6 border border-[var(--border)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                             <Zap className="h-8 w-8 text-[var(--color-primary)]" />
                        </div>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">Direct Uplink Token</p>
                        <div className="flex items-center gap-4">
                            <code className="flex-1 text-2xl font-mono font-bold text-[var(--color-primary)] tracking-[0.2em]">{inviteCode}</code>
                            <button onClick={copyCode}
                                className={cn(
                                    "jira-button h-10 px-4 gap-2 font-bold uppercase text-[10px] transition-all",
                                    copied ? "bg-emerald-500 text-white border-emerald-500" : "jira-button-primary"
                                )}>
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? 'Captured' : 'Capture'}
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-tight">Personnel can join the mission instantly using this signature.</p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-[var(--border)]" />
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.3em]">SECURE DISPATCH</span>
                        <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    {/* Email invite */}
                    <form onSubmit={handleInvite} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-[3px] text-[10px] font-bold uppercase tracking-tight flex items-center gap-2">
                                <X className="h-3.5 w-3.5" /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-[3px] text-[10px] font-bold uppercase tracking-tight flex items-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5" /> {success}
                            </div>
                        )}
                        
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Personnel Identifier (Email)</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <input type="email" placeholder="OPERATOR@TARGET_ORG.COM"
                                        className="w-full pl-10 pr-3 py-3 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase"
                                        value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                                <button type="submit" disabled={loading}
                                    className="jira-button jira-button-primary h-12 px-6 font-bold uppercase text-[10px] shadow-lg shadow-blue-100 disabled:opacity-50">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Transmit'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                         <div className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 text-slate-300" />
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Relay Active</span>
                         </div>
                         <button onClick={onClose}
                            className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors">
                            Dismiss Terminal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
