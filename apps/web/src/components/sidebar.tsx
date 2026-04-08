"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Briefcase, CheckSquare, Users, MessageSquare,
    Shield, LogOut, ChevronRight, BarChart2, FileText, Calendar,
    Search, Settings, Activity, X, Ticket, GitBranch, Clock,
    Bug, BookOpen, Megaphone, LayoutGrid, UserCheck, UserCog,
    ChevronLeft, Plus
} from 'lucide-react';
import { callLogout } from '@/lib/audit-api';
import { useState, useEffect } from 'react';

const mainNav = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/projects', label: 'Projects', icon: Briefcase },
    { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/dashboard/teams', label: 'Teams', icon: Users },
    { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
];

const enterpriseNav = [
    { href: '/dashboard/my-workspace', label: 'My Workspace', icon: LayoutGrid },
    { href: '/dashboard/tickets', label: 'Service Requests', icon: Ticket },
    { href: '/dashboard/approvals', label: 'Approvals', icon: GitBranch },
    { href: '/dashboard/time-tracking', label: 'Time Tracking', icon: Clock },
    { href: '/dashboard/bugs', label: 'Bug Tracker', icon: Bug },
    { href: '/dashboard/workload', label: 'Resource Mgmt', icon: UserCheck },
    { href: '/dashboard/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
    { href: '/dashboard/company-news', label: 'Company News', icon: Megaphone },
];

const insightsNav = [
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/dashboard/reports', label: 'Reports', icon: FileText },
    { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/search', label: 'Search', icon: Search },
    { href: '/dashboard/audit', label: 'Activity Log', icon: Activity },
];

const systemNav = [
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    { href: '/dashboard/admin', label: 'Admin Panel', icon: Shield },
    { href: '/dashboard/employee-management', label: 'Employee Management', icon: UserCog },
    { href: '/dashboard/client-management', label: 'Client Management', icon: Users },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Read role from localStorage
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const userRole = storedUser ? (JSON.parse(storedUser).roles?.[0] || '').toUpperCase() : '';
    const isStudent = userRole === 'STUDENT';

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname === href || pathname?.startsWith(href + '/');

    const handleLogout = async () => {
        try { await callLogout(); } catch { }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
        const active = isActive(item.href, (item as any).exact);
        return (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-[3px] text-[14px] font-medium transition-colors duration-100 group mb-1",
                    active
                        ? "bg-[var(--sidebar-hover)] text-[var(--sidebar-active)]"
                        : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white"
                )}
            >
                <item.icon className={cn("h-[16px] w-[16px] shrink-0", active ? "text-[var(--sidebar-active)]" : "group-hover:text-white")} />
                {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                {active && !isCollapsed && <div className="w-1.5 h-1.5 rounded-full bg-[var(--sidebar-active)]" />}
            </Link>
        );
    };

    const SectionLabel = ({ label }: { label: string }) => (
        !isCollapsed ? (
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-tight px-3 mb-2 mt-4">
                {label}
            </p>
        ) : <div className="h-4" />
    );

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                onClick={onClose}
                className={cn(
                    "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity lg:hidden",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            />

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed lg:static top-0 left-0 z-50 h-screen flex flex-col transition-all duration-300 ease-in-out border-r border-white/10",
                    isCollapsed ? "w-16" : "w-64",
                    open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
                style={{ backgroundColor: 'var(--sidebar-bg)' }}
            >
                {/* Brand / Logo */}
                <div className="flex items-center gap-3 px-4 py-6 mb-2">
                    <div className="w-8 h-8 rounded-[4px] bg-white flex items-center justify-center shrink-0">
                        <span className="text-[var(--sidebar-bg)] font-black text-lg">E</span>
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="text-white font-bold text-lg leading-none tracking-tight">ESMP</p>
                            <p className="text-white/50 text-[10px] mt-1 font-medium uppercase tracking-wider">Enterprise Pro</p>
                        </div>
                    )}
                </div>

                {/* Quick Action (Jira Create) */}
                <div className="px-3 mb-6">
                    <button
                        className={cn(
                            "w-full h-10 rounded-[3px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors group",
                            isCollapsed ? "px-0" : "px-4 gap-2"
                        )}
                        onClick={() => router.push('/dashboard/tasks?action=create')}
                    >
                        <Plus className="h-5 w-5" />
                        {!isCollapsed && <span className="font-semibold text-sm">Create</span>}
                    </button>
                </div>

                {/* Scrollable Navigation */}
                <nav className="flex-1 px-3 overflow-y-auto no-scrollbar pb-10">
                    <SectionLabel label="General" />
                    {mainNav.map(item => <NavItem key={item.href} item={item} />)}

                    {!isStudent && (
                        <>
                            <SectionLabel label="Operations" />
                            {enterpriseNav.map(item => <NavItem key={item.href} item={item} />)}
                        </>
                    )}

                    <SectionLabel label="Analytics" />
                    {insightsNav.map(item => <NavItem key={item.href} item={item} />)}

                    <SectionLabel label="System" />
                    {systemNav
                        .filter(item => {
                            if (item.href === '/dashboard/admin') return userRole === 'ADMIN';
                            if (item.href === '/dashboard/employee-management') return ['MANAGER', 'ADMIN'].includes(userRole);
                            if (item.href === '/dashboard/client-management') return ['MANAGER', 'ADMIN'].includes(userRole);
                            return true;
                        })
                        .map(item => <NavItem key={item.href} item={item} />)}
                </nav>

                {/* Collapse Toggle & Logout */}
                <div className="mt-auto border-t border-white/10 p-3 space-y-1">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex items-center gap-3 px-3 py-2 w-full rounded-[3px] text-[14px] font-medium text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white transition-colors"
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        {!isCollapsed && <span>Collapse sidebar</span>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 w-full rounded-[3px] text-[14px] font-medium text-[var(--sidebar-text)] hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        {!isCollapsed && <span>Sign out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
