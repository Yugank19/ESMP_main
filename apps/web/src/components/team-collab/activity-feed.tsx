"use client";

import { useEffect, useState, useCallback } from 'react';
import {
    Activity, UserPlus, CheckSquare, Upload, Megaphone,
    Target, BookOpen, MessageSquare, TrendingUp, RefreshCw,
    Clock, ShieldCheck, Zap, History, ChevronRight
} from 'lucide-react';
import { teamCollabApi } from '@/lib/team-collab-api';
import { cn } from '@/lib/utils';

interface ActivityItem {
    id: string;
    action: string;
    description?: string;
    created_at: string;
    user: { id: string; name: string; avatar_url?: string };
}

interface Props {
    teamId: string;
}

const ACTION_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
    MEMBER_JOINED: { icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    TASK_CREATED: { icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    TASK_UPDATED: { icon: Zap, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    FILE_UPLOADED: { icon: Upload, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
    ANNOUNCEMENT_POSTED: { icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    MILESTONE_CREATED: { icon: Target, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
    MILESTONE_UPDATED: { icon: Target, color: 'text-rose-500', bg: 'bg-rose-50' },
    MEETING_NOTE_CREATED: { icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' },
    PROGRESS_SUBMITTED: { icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
    MESSAGE_SENT: { icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' },
};

function getActionMeta(action: string) {
    return ACTION_ICONS[action] || { icon: Activity, color: 'text-[var(--text-muted)]', bg: 'bg-slate-50 border-slate-100' };
}

function groupByDate(items: ActivityItem[]) {
    const groups: { label: string; items: ActivityItem[] }[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    items.forEach(item => {
        const d = new Date(item.created_at).toDateString();
        const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
        const last = groups[groups.length - 1];
        if (last && last.label === label) last.items.push(item);
        else groups.push({ label, items: [item] });
    });
    return groups;
}

export default function ActivityFeed({ teamId }: Props) {
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await teamCollabApi.getActivity(teamId);
            setActivity(res.data);
        } catch { }
        finally { setLoading(false); }
    }, [teamId]);

    useEffect(() => { load(); }, [load]);

    const groups = groupByDate(activity);

    return (
        <div className="flex flex-col h-full bg-white rounded-[3px] border border-[var(--border)] overflow-hidden shadow-sm animate-in fade-in duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <History className="h-4 w-4 text-[var(--color-primary)]" />
                    <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Live Operational Feed</h2>
                </div>
                <button 
                    onClick={load} 
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-white rounded-[3px] border border-transparent hover:border-[var(--border)] transition-all"
                    title="Synchronize Feed"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                         <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                         <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Decrypting Stream...</span>
                    </div>
                ) : activity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-30">
                        <Activity className="h-12 w-12 text-[var(--text-muted)] mb-4 stroke-[1px]" />
                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Feed Silent</h3>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] mt-2 uppercase tracking-tight">No operational activity detected in current cycle.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {groups.map(group => (
                            <div key={group.label} className="flex flex-col">
                                <div className="px-6 py-2 bg-slate-50 border-y border-[var(--border)] first:border-t-0">
                                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">{group.label}</span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {group.items.map(item => {
                                        const meta = getActionMeta(item.action);
                                        const ActionIcon = meta.icon;
                                        return (
                                            <div key={item.id} className="group flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-[3px] border flex items-center justify-center shrink-0 mt-0.5 shadow-sm transition-transform group-hover:scale-105",
                                                    meta.bg
                                                )}>
                                                    <ActionIcon className={cn("h-4.5 w-4.5", meta.color)} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-4 mb-0.5">
                                                        <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-tight truncate">{item.user.name}</span>
                                                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter whitespace-nowrap opacity-60 flex items-center gap-1">
                                                            <Clock className="h-2.5 w-2.5" />
                                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                                                        {item.description 
                                                            ? item.description 
                                                            : `Executed sequence ${item.action.replace(/_/g, ' ')}`}
                                                    </p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                                     <ChevronRight className="h-4 w-4 text-slate-300" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Summary */}
            {!loading && activity.length > 0 && (
                <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                         <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 opacity-60" />
                         <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">End-to-End Operational Integrity Verified</span>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight">Stream ID: {teamId.substring(0,8).toUpperCase()}</span>
                </div>
            )}
        </div>
    );
}
