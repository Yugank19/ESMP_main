"use client";

import { useEffect, useState, useCallback } from 'react';
import {
    Activity, UserPlus, CheckSquare, Upload, Megaphone,
    Target, BookOpen, MessageSquare, TrendingUp, RefreshCw
} from 'lucide-react';
import { teamCollabApi } from '@/lib/team-collab-api';

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
    MEMBER_JOINED: { icon: UserPlus, color: 'text-green-600', bg: 'bg-green-100' },
    TASK_CREATED: { icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
    TASK_UPDATED: { icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
    FILE_UPLOADED: { icon: Upload, color: 'text-purple-600', bg: 'bg-purple-100' },
    ANNOUNCEMENT_POSTED: { icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-100' },
    MILESTONE_CREATED: { icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    MILESTONE_UPDATED: { icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    MEETING_NOTE_CREATED: { icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-100' },
    PROGRESS_SUBMITTED: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    MESSAGE_SENT: { icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-100' },
};

function getActionMeta(action: string) {
    return ACTION_ICONS[action] || { icon: Activity, color: 'text-[#64748B]', bg: 'bg-[#F1F5F9]' };
}

function groupByDate(items: ActivityItem[]) {
    const groups: { label: string; items: ActivityItem[] }[] = [];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    items.forEach(item => {
        const d = new Date(item.created_at).toDateString();
        const label = d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [teamId]);

    useEffect(() => { load(); }, [load]);

    const groups = groupByDate(activity);

    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#1D4ED8]" />
                    <h2 className="text-sm font-semibold text-[#0F172A]">Activity Feed</h2>
                </div>
                <button onClick={load} className="p-1.5 text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition">
                    <RefreshCw className="h-3.5 w-3.5" />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="h-6 w-6 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
                </div>
            ) : activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                    <Activity className="h-10 w-10 text-[#CBD5E1] mb-3" />
                    <p className="text-sm text-[#64748B]">No activity yet.</p>
                    <p className="text-xs text-[#94A3B8] mt-1">Team actions will appear here.</p>
                </div>
            ) : (
                <div className="divide-y divide-[#F8FAFC] max-h-[600px] overflow-y-auto">
                    {groups.map(group => (
                        <div key={group.label}>
                            <div className="px-5 py-2 bg-[#F8FAFC]">
                                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wide">{group.label}</span>
                            </div>
                            {group.items.map(item => {
                                const meta = getActionMeta(item.action);
                                const Icon = meta.icon;
                                return (
                                    <div key={item.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition">
                                        <div className={`w-8 h-8 rounded-full ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                            <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-[#0F172A] leading-snug">
                                                <span className="font-semibold">{item.user.name}</span>
                                                {item.description ? ` ${item.description}` : ` performed ${item.action.toLowerCase().replace(/_/g, ' ')}`}
                                            </p>
                                            <p className="text-xs text-[#94A3B8] mt-0.5">
                                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
