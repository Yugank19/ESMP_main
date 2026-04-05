"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Briefcase, CheckSquare, Users, MessageSquare,
    Shield, LogOut, ChevronRight, BarChart2, FileText, Calendar,
    Search, Settings, Activity, X, Ticket, GitBranch, Clock,
    Bug, BookOpen, Megaphone, LayoutGrid, UserCheck, UserCog
} from 'lucide-react';
import { callLogout } from '@/lib/audit-api';

const mainNav = [
    { href: '/dashboard',          label: 'Dashboard',   icon: LayoutDashboard, exact: true },
    { href: '/dashboard/projects', label: 'Projects',    icon: Briefcase },
    { href: '/dashboard/tasks',    label: 'Tasks',       icon: CheckSquare },
    { href: '/dashboard/teams',    label: 'Teams',       icon: Users },
    { href: '/dashboard/chat',     label: 'Chat',        icon: MessageSquare },
];

// Employee/company-only nav — hidden from STUDENT role (enforced in each page)
const enterpriseNav = [
    { href: '/dashboard/my-workspace',   label: 'My Workspace',     icon: LayoutGrid },
    { href: '/dashboard/tickets',        label: 'Service Requests', icon: Ticket },
    { href: '/dashboard/approvals',      label: 'Approvals',        icon: GitBranch },
    { href: '/dashboard/time-tracking',  label: 'Time Tracking',    icon: Clock },
    { href: '/dashboard/bugs',           label: 'Bug Tracker',      icon: Bug },
    { href: '/dashboard/workload',       label: 'Resource Mgmt',    icon: UserCheck },
    { href: '/dashboard/knowledge-base', label: 'Knowledge Base',   icon: BookOpen },
    { href: '/dashboard/company-news',   label: 'Company News',     icon: Megaphone },
];

const insightsNav = [
    { href: '/dashboard/analytics', label: 'Analytics',    icon: BarChart2 },
    { href: '/dashboard/reports',   label: 'Reports',      icon: FileText },
    { href: '/dashboard/calendar',  label: 'Calendar',     icon: Calendar },
    { href: '/dashboard/search',    label: 'Search',       icon: Search },
    { href: '/dashboard/audit',     label: 'Activity Log', icon: Activity },
];

const systemNav = [
    { href: '/dashboard/settings',           label: 'Settings',           icon: Settings },
    { href: '/dashboard/admin',              label: 'Admin Panel',         icon: Shield },
    { href: '/dashboard/employee-management',label: 'Employee Management', icon: UserCog },
    { href: '/dashboard/client-management',  label: 'Client Management',   icon: Users },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    // Read role from localStorage — STUDENT never sees enterprise features
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const userRole = storedUser ? (JSON.parse(storedUser).roles?.[0] || '').toUpperCase() : '';
    const isStudent = userRole === 'STUDENT';

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname === href || pathname?.startsWith(href + '/');

    const handleLogout = async () => {
        try { await callLogout(); } catch {}
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
        const active = isActive(item.href, (item as any).exact);
        return (
            <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all duration-150 group",
                    active
                        ? "bg-[#1D4ED8] text-white shadow-sm shadow-blue-900/30"
                        : "text-slate-400 hover:text-white hover:bg-white/8"
                )}
            >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-150", active ? "scale-110" : "group-hover:scale-105")} />
                <span className="flex-1 truncate">{item.label}</span>
                {active && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
            </Link>
        );
    };

    const SectionLabel = ({ label }: { label: string }) => (
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-1.5 mt-1">
            {label}
        </p>
    );

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
            />

            {/* Drawer */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-64 flex flex-col",
                    "transition-transform duration-300 ease-in-out",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
                style={{ backgroundColor: 'var(--sidebar-bg)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/40">
                            <span className="text-white font-bold text-sm">E</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-[15px] leading-none tracking-tight">ESMP</p>
                            <p className="text-slate-500 text-[11px] mt-0.5">Management Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close sidebar"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
                    <SectionLabel label="Main" />
                    {mainNav.map(item => <NavItem key={item.href} item={item} />)}

                    {!isStudent && (
                        <div className="pt-4">
                            <SectionLabel label="Enterprise" />
                            {enterpriseNav.map(item => <NavItem key={item.href} item={item} />)}
                        </div>
                    )}

                    <div className="pt-4">
                        <SectionLabel label="Insights" />
                        {insightsNav.map(item => <NavItem key={item.href} item={item} />)}
                    </div>

                    <div className="pt-4">
                        <SectionLabel label="System" />
                        {systemNav
                          .filter(item => {
                            // Admin Panel only for ADMIN role
                            if (item.href === '/dashboard/admin') {
                              return userRole === 'ADMIN';
                            }
                            // Employee Management only for managers/admins
                            if (item.href === '/dashboard/employee-management') {
                              return ['MANAGER', 'ADMIN'].includes(userRole);
                            }
                            // Client Management only for managers/admins
                            if (item.href === '/dashboard/client-management') {
                              return ['MANAGER', 'ADMIN'].includes(userRole);
                            }
                            return true;
                          })
                          .map(item => <NavItem key={item.href} item={item} />)}
                    </div>
                </nav>

                {/* Footer */}
                <div className="px-3 py-4 border-t border-white/10 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[15px] font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <LogOut className="h-[18px] w-[18px] shrink-0" />
                        Sign out
                    </button>
                </div>
            </aside>
        </>
    );
}
