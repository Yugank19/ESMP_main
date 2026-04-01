"use client";

import { CheckSquare, Clock, AlertTriangle, TrendingUp, Target, Calendar } from 'lucide-react';

export default function ProjectDashboard({ stats }: { stats: any }) {
    if (!stats) return null;

    const cards = [
        { label: 'Total Tasks', value: stats.total, icon: CheckSquare, color: 'bg-blue-50 text-blue-600' },
        { label: 'Completed', value: stats.completed, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
        { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-purple-50 text-purple-600' },
        { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: stats.overdue > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500' },
        { label: 'Milestones', value: stats.milestones, icon: Target, color: 'bg-amber-50 text-amber-600' },
        { label: 'Pending', value: stats.pending, icon: Calendar, color: 'bg-slate-50 text-slate-600' },
    ];

    return (
        <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {cards.map(c => (
                    <div key={c.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c.color}`}>
                            <c.icon className="h-4 w-4" />
                        </div>
                        <p className="text-xl font-bold text-[#0F172A]">{c.value}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#0F172A]">Overall Progress</span>
                    <span className="text-sm font-bold text-[#1D4ED8]">{stats.completion_pct}%</span>
                </div>
                <div className="w-full bg-[#F1F5F9] rounded-full h-3">
                    <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{
                            width: `${stats.completion_pct}%`,
                            background: stats.completion_pct === 100
                                ? '#22C55E'
                                : stats.completion_pct > 60
                                ? '#1D4ED8'
                                : stats.completion_pct > 30
                                ? '#F59E0B'
                                : '#EF4444',
                        }}
                    />
                </div>
                <div className="flex justify-between text-xs text-[#94A3B8] mt-1.5">
                    <span>{stats.completed} completed</span>
                    <span>{stats.pending} remaining</span>
                </div>
            </div>

            {/* Upcoming deadlines */}
            {stats.upcoming_deadlines?.length > 0 && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                    <h3 className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#1D4ED8]" />
                        Upcoming Deadlines (next 7 days)
                    </h3>
                    <div className="space-y-2.5">
                        {stats.upcoming_deadlines.map((task: any) => {
                            const days = Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000);
                            return (
                                <div key={task.id} className="flex items-center justify-between py-2 border-b border-[#F8FAFC] last:border-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${days === 0 ? 'bg-red-500' : days <= 2 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                        <span className="text-sm text-[#0F172A] font-medium">{task.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {task.assignees?.slice(0, 2).map((a: any) => (
                                            <span key={a.user_id} className="text-xs text-[#64748B]">{a.user?.name}</span>
                                        ))}
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                            ${days === 0 ? 'bg-red-100 text-red-700' : days <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {days === 0 ? 'Today' : `${days}d`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Overdue warning */}
            {stats.overdue > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-red-700">
                            {stats.overdue} task{stats.overdue !== 1 ? 's are' : ' is'} overdue
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">Review the Tasks tab and update or reassign overdue work.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
