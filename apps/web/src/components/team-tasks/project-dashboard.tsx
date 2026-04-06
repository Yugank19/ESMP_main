"use client";

import { CheckSquare, Clock, AlertTriangle, TrendingUp, Target, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectDashboard({ stats }: { stats: any }) {
    if (!stats) return null;

    const cards = [
        { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Completed', value: stats.completed, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: stats.overdue > 0 ? 'text-red-600' : 'text-slate-500', bg: stats.overdue > 0 ? 'bg-red-50' : 'bg-slate-50' },
        { label: 'Milestones', value: stats.milestones, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Backlog', value: stats.pending, icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-50' },
    ];

    return (
        <div className="space-y-6">
            {/* Stat cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {cards.map(c => (
                    <div key={c.label} className="card p-5 group hover:border-[var(--color-primary)] transition-all">
                        <div className={cn("w-9 h-9 rounded-[3px] flex items-center justify-center mb-4 transition-transform group-hover:scale-110", c.bg)}>
                            <c.icon className={cn("h-4.5 w-4.5", c.color)} />
                        </div>
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{c.value}</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{c.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Progress Card */}
                <div className="card p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Project Velocity</h3>
                            <span className="text-lg font-bold text-[var(--color-primary)]">{stats.completion_pct}%</span>
                        </div>
                        <div className="w-full bg-[var(--bg-surface-3)] rounded-full h-2.5 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: `${stats.completion_pct}%`,
                                    background: stats.completion_pct === 100
                                        ? '#36B37E'
                                        : stats.completion_pct > 60
                                        ? '#0052CC'
                                        : stats.completion_pct > 30
                                        ? '#FFAB00'
                                        : '#FF5630',
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-3 bg-[var(--bg-surface-2)] rounded-[3px] border border-[var(--border)]">
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Successful Outcomes</p>
                                <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{stats.completed} <span className="text-[10px] text-[var(--text-muted)]">Tasks</span></p>
                            </div>
                            <div className="p-3 bg-[var(--bg-surface-2)] rounded-[3px] border border-[var(--border)]">
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase">Pending Requirements</p>
                                <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{stats.pending} <span className="text-[10px] text-[var(--text-muted)]">Tasks</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming deadlines */}
                <div className="card p-0 flex flex-col">
                    <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Critical Deadlines</h3>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Next 7 Days</span>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[220px] no-scrollbar">
                        {stats.upcoming_deadlines?.length > 0 ? (
                            <table className="w-full text-xs">
                                <tbody className="divide-y divide-[var(--border)]">
                                    {stats.upcoming_deadlines.map((task: any) => {
                                        const days = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000);
                                        return (
                                            <tr key={task.id} className="hover:bg-[var(--bg-surface-2)] transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-1.5 h-6 rounded-full", days === 0 ? 'bg-red-500' : days <= 2 ? 'bg-amber-500' : 'bg-blue-500')} />
                                                        <span className="font-bold text-[var(--text-primary)] line-clamp-1">{task.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-1 rounded-[3px] uppercase tracking-tighter",
                                                        days === 0 ? 'bg-red-50 text-red-700' : days <= 2 ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                                                    )}>
                                                        {days === 0 ? 'Due Today' : days === 1 ? 'Due Tomorrow' : `${days} Days Left`}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40">
                                <Calendar className="h-8 w-8 mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">No Critical Deadlines</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Overdue alert banner if necessary */}
            {stats.overdue > 0 && (
                <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-[3px] animate-in slide-in-from-top-2 duration-300">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <ShieldAlert className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-red-700 uppercase tracking-tight">Warning: Breach Detected</p>
                        <p className="text-xs text-red-600 font-medium mt-0.5">There are {stats.overdue} tasks past their mandated deadline. Immediate intervention required.</p>
                    </div>
                    <button className="text-xs font-bold text-red-700 hover:underline uppercase tracking-wider px-3 py-1.5 bg-red-100 rounded-[3px] transition-colors">
                        View Breaches
                    </button>
                </div>
            )}
        </div>
    );
}
