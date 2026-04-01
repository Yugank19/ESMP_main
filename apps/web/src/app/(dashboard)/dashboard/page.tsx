"use client";

import { useEffect, useState } from 'react';
import { Briefcase, CheckSquare, AlertCircle, Users, ArrowUpRight, BarChart2, Calendar, FileText, Activity, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getGlobalAnalytics } from '@/lib/analytics-api';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) { router.push('/login'); return; }
        setUser(JSON.parse(stored));
        loadData();
    }, []);

    async function loadData() {
        try {
            const g = await getGlobalAnalytics();
            setAnalytics(g);
        } catch {}

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
                setRecentActivity(Array.isArray(acts) ? acts.slice(0, 5) : []);
            }
        } catch {}
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
            </div>
        );
    }

    const role: string = user?.roles?.[0]?.role?.name || user?.roles?.[0] || 'EMPLOYEE';

    const stats = [
        { label: 'Teams', value: analytics?.totalTeams ?? 'â€”', icon: Users, color: 'bg-blue-50 text-blue-600', href: '/dashboard/teams' },
        { label: 'Total Tasks', value: analytics?.totalTasks ?? 'â€”', icon: CheckSquare, color: 'bg-green-50 text-green-600', href: '/dashboard/tasks' },
        { label: 'Completed', value: analytics?.completedTasks ?? 'â€”', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', href: '/dashboard/analytics' },
        { label: 'Overdue', value: analytics?.overdueTasks ?? 'â€”', icon: AlertCircle, color: 'bg-red-50 text-red-600', href: '/dashboard/analytics' },
    ];

    const quickLinks = [
        { label: 'Analytics', icon: BarChart2, href: '/dashboard/analytics', desc: 'View performance metrics' },
        { label: 'Reports', icon: FileText, href: '/dashboard/reports', desc: 'Generate team reports' },
        { label: 'Calendar', icon: Calendar, href: '/dashboard/calendar', desc: 'Deadlines and events' },
        { label: 'Activity Log', icon: Activity, href: '/dashboard/audit', desc: 'Track team actions' },
    ];

    return (
        <div className="space-y-6 ">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard</h1>
                <p className="text-[15px] text-[#64748B] mt-0.5">
                    Welcome back, <span className="font-medium text-[#0F172A]">{user.name}</span>. Here&apos;s what&apos;s happening today.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Link key={stat.label} href={stat.href}
                        className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow block">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <ArrowUpRight className="h-4 w-4 text-[#94A3B8]" />
                        </div>
                        <p className="text-3xl font-bold text-[#0F172A]">{stat.value}</p>
                        <p className="text-[15px] font-medium text-[#64748B] mt-0.5">{stat.label}</p>
                        {analytics && stat.label === 'Total Tasks' && (
                            <p className="text-xs text-[#94A3B8] mt-1">{analytics.completionRate}% completion rate</p>
                        )}
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent activity */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[15px] font-semibold text-[#0F172A]">Recent Activity</h2>
                        <Link href="/dashboard/audit" className="text-xs text-[#1D4ED8] hover:underline font-medium">View all</Link>
                    </div>
                    {recentActivity.length === 0 ? (
                        <div className="text-center py-8">
                            <Activity className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
                            <p className="text-sm text-[#94A3B8]">No recent activity</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentActivity.map((item: any, i: number) => (
                                <div key={item.id || i} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#1D4ED8] flex items-center justify-center shrink-0 text-white text-xs font-bold">
                                        {item.user?.name?.[0] ?? '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-medium text-[#0F172A]">
                                            <span>{item.user?.name}</span> {item.action}
                                        </p>
                                        {item.description && <p className="text-xs text-[#64748B] mt-0.5">{item.description}</p>}
                                    </div>
                                    <span className="text-xs text-[#94A3B8] shrink-0">{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick links */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                    <h2 className="text-[15px] font-semibold text-[#0F172A] mb-4">Quick Access</h2>
                    <div className="space-y-2">
                        {quickLinks.map(link => (
                            <Link key={link.href} href={link.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                                    <link.icon className="h-4 w-4 text-[#1D4ED8]" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-medium text-[#0F172A]">{link.label}</p>
                                    <p className="text-xs text-[#64748B]">{link.desc}</p>
                                </div>
                            </Link>
                        ))}
                        {role === 'MANAGER' && (
                            <Link href="/dashboard/admin"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
                                    <Briefcase className="h-4 w-4 text-[#1D4ED8]" />
                                </div>
                                <div>
                                    <p className="text-[15px] font-medium text-[#0F172A]">Admin Panel</p>
                                    <p className="text-xs text-[#64748B]">Manage users and roles</p>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Completion ring */}
            {analytics && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[15px] font-semibold text-[#0F172A]">Overall Progress</h2>
                        <Link href="/dashboard/analytics" className="text-xs text-[#1D4ED8] hover:underline font-medium">Full analytics</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Completion Rate', value: `${analytics.completionRate}%`, color: 'text-emerald-600' },
                            { label: 'Pending Tasks', value: analytics.pendingTasks ?? 0, color: 'text-blue-600' },
                            { label: 'Overdue Tasks', value: analytics.overdueTasks ?? 0, color: 'text-red-500' },
                            { label: 'Files Uploaded', value: analytics.totalFiles ?? 0, color: 'text-purple-600' },
                        ].map(item => (
                            <div key={item.label} className="text-center p-4 bg-[#F8FAFC] rounded-lg">
                                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                                <p className="text-xs text-[#64748B] mt-1">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
