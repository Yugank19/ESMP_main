"use client";

import { useEffect, useState } from 'react';
import {
    Briefcase, CheckSquare, AlertCircle, Users, ArrowUpRight,
    BarChart2, Calendar, FileText, Activity, TrendingUp,
    Clock, CheckCircle2, ListTodo, Plus, Globe, Shield, Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getGlobalAnalytics } from '@/lib/analytics-api';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { router.push('/login'); return; }
        setUser(JSON.parse(stored));
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const g = await getGlobalAnalytics();
            setAnalytics(g);
        } catch { }

        try {
            const token = localStorage.getItem('token');
            const teamsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/teams`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const teams = await teamsRes.json();
            if (Array.isArray(teams) && teams.length > 0) {
                const actRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/audit/team/${teams[0].id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const acts = await actRes.json();
                setRecentActivity(Array.isArray(acts) ? acts.slice(0, 10) : []);
            }
        } catch { }
        finally { setLoading(false); }
    }

    if (!user || loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
            </div>
        );
    }

    const role = (user.roles?.[0]?.role?.name || user.roles?.[0] || 'EMPLOYEE').toUpperCase();

    // Summary Cards Configuration
    const summaryCards = [
        {
            label: 'In Progress',
            count: analytics?.pendingTasks ?? 0,
            icon: Clock,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            link: '/dashboard/tasks?status=IN_PROGRESS'
        },
        {
            label: 'Due Soon',
            count: analytics?.overdueTasks ?? 0,
            icon: AlertCircle,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            link: '/dashboard/tasks?filter=upcoming'
        },
        {
            label: 'Completed',
            count: analytics?.completedTasks ?? 0,
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50',
            link: '/dashboard/tasks?status=DONE'
        },
        {
            label: 'Total Scope',
            count: analytics?.totalTasks ?? 0,
            icon: ListTodo,
            color: 'text-[var(--text-primary)]',
            bg: 'bg-slate-50',
            link: '/dashboard/tasks'
        },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Welcome Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
                <div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mb-2">
                        <Globe className="h-3 w-3" />
                        <span>Global Workspace</span>
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                        Good day, {user.name.split(' ')[0]}!
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1.5 font-medium">
                        Here is what's happening across your teams today.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/tasks?action=create" className="jira-button jira-button-primary gap-2 h-9">
                        <Plus className="h-4 w-4" />
                        <span>Create Task</span>
                    </Link>
                    <button onClick={loadData} className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] h-9">
                        Refresh
                    </button>
                </div>
            </header>

            {/* Role-Specific Overview Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, idx) => (
                    <Link key={idx} href={card.link} className="card p-5 group">
                        <div className="flex items-start justify-between">
                            <div className={cn("p-2 rounded-[3px]", card.bg)}>
                                <card.icon className={cn("h-5 w-5", card.color)} />
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors">VIEW ALL</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-[var(--text-primary)]">{card.count}</h3>
                            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">{card.label}</p>
                        </div>
                    </Link>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Activity & Focus */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Activity Feed */}
                    <div className="card h-full">
                        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                            <h2 className="text-sm font-bold uppercase tracking-tight text-[var(--text-primary)]">Stream Activity</h2>
                            <Link href="/dashboard/audit" className="text-xs font-bold text-[var(--color-primary)] hover:underline">View Log</Link>
                        </div>
                        <div className="p-6">
                            {recentActivity.length > 0 ? (
                                <div className="space-y-6">
                                    {recentActivity.map((item, i) => (
                                        <div key={i} className="flex gap-4 group">
                                            <div className="relative shrink-0">
                                                <div className="w-9 h-9 rounded-full bg-[var(--bg-surface-2)] flex items-center justify-center text-[var(--color-primary)] font-bold text-xs ring-2 ring-white">
                                                    {item.user?.name?.[0] || 'U'}
                                                </div>
                                                {i < recentActivity.length - 1 && (
                                                    <div className="absolute top-9 left-1/2 -translate-x-1/2 w-[1px] h-full bg-[var(--border)] group-last:hidden" />
                                                )}
                                            </div>
                                            <div className="pb-6 w-full border-b border-[var(--border)] group-last:border-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">
                                                        {item.user?.name}
                                                    </p>
                                                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-[var(--text-secondary)]">
                                                    {item.action} <span className="font-bold text-[var(--text-primary)]">{item.description}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <Activity className="h-10 w-10 text-[var(--border)] mx-auto mb-4" />
                                    <p className="text-sm text-[var(--text-muted)] font-medium">Quiet day... check back later for updates.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Insights & Quick Actions */}
                <div className="space-y-6">
                    {/* Role Specific Panel */}
                    <div className="card overflow-hidden">
                        <div className="p-5 bg-[var(--color-primary)]">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider">{role} Insights</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            {role === 'MANAGER' || role === 'ADMIN' ? (
                                <>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        You are managing <span className="font-bold text-[var(--text-primary)]">{analytics?.totalTeams || 0} teams</span>.
                                        Overall task velocity is at <span className="font-bold text-green-600">{analytics?.completionRate || 0}%</span>.
                                    </p>
                                    <div className="space-y-2">
                                        <Link href="/dashboard/approvals" className="flex items-center justify-between p-3 rounded-[3px] bg-[var(--bg-base)] hover:bg-[var(--bg-surface-2)] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Shield className="h-4 w-4 text-[var(--color-primary)]" />
                                                <span className="text-xs font-bold text-[var(--text-primary)]">Pending Approvals</span>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)]" />
                                        </Link>
                                        <Link href="/dashboard/reports" className="flex items-center justify-between p-3 rounded-[3px] bg-[var(--bg-base)] hover:bg-[var(--bg-surface-2)] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-[var(--color-primary)]" />
                                                <span className="text-xs font-bold text-[var(--text-primary)]">Team Performance</span>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)]" />
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        You have <span className="font-bold text-amber-600">{analytics?.pendingTasks || 0} items</span> in your backlog.
                                        Keep up the momentum!
                                    </p>
                                    <Link href="/dashboard/my-workspace" className="flex items-center justify-between p-3 rounded-[3px] bg-[var(--bg-base)] hover:bg-[var(--bg-surface-2)] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="h-4 w-4 text-[var(--color-primary)]" />
                                            <span className="text-xs font-bold text-[var(--text-primary)]">Personal Workspace</span>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)]" />
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="card">
                        <div className="px-5 py-4 border-b border-[var(--border)]">
                            <h2 className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Quick Navigation</h2>
                        </div>
                        <div className="p-2 grid grid-cols-2 gap-1">
                            {[
                                { label: 'Projects', icon: Briefcase, href: '/dashboard/projects' },
                                { label: 'Teammates', icon: Users, href: '/dashboard/teams' },
                                { label: 'Calendar', icon: Calendar, href: '/dashboard/calendar' },
                                { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
                            ].map(item => (
                                <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 p-4 rounded-[3px] hover:bg-[var(--bg-surface-2)] transition-colors">
                                    <item.icon className="h-5 w-5 text-[var(--text-secondary)]" />
                                    <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
