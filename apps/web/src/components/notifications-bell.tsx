"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Users, Check, X, CheckCheck } from 'lucide-react';
import { notificationsApi } from '@/lib/notifications-api';
import { cn } from '@/lib/utils';

export default function NotificationsBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unread, setUnread] = useState(0);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const load = async () => {
        try {
            const [notifRes, countRes] = await Promise.all([
                notificationsApi.getAll(),
                notificationsApi.getUnreadCount(),
            ]);
            setNotifications(notifRes.data);
            setUnread(countRes.data.count);
        } catch { /* not logged in yet */ }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000); // poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleAccept = async (notif: any) => {
        const inviteId = notif.payload?.invite_id;
        if (!inviteId) return;
        setActionLoading(notif.id + 'accept');
        try {
            const res = await notificationsApi.acceptInvite(inviteId);
            await notificationsApi.markRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true, _accepted: true } : n));
            setUnread(u => Math.max(0, u - 1));
            // Navigate to the team workspace
            if (res.data.team_id) {
                setOpen(false);
                router.push(`/dashboard/teams/${res.data.team_id}`);
            }
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to accept invite');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDecline = async (notif: any) => {
        const inviteId = notif.payload?.invite_id;
        if (!inviteId) return;
        setActionLoading(notif.id + 'decline');
        try {
            await notificationsApi.declineInvite(inviteId);
            await notificationsApi.markRead(notif.id);
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true, _declined: true } : n));
            setUnread(u => Math.max(0, u - 1));
        } catch (e: any) {
            alert(e.response?.data?.message || 'Failed to decline invite');
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAllRead = async () => {
        await notificationsApi.markAllRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnread(0);
    };

    const unreadNotifs = notifications.filter(n => !n.read);
    const readNotifs = notifications.filter(n => n.read);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="relative p-1.5 rounded hover:bg-[var(--bg-surface-2)] transition-colors text-[var(--text-secondary)]"
            >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-10 w-96 bg-[var(--bg-surface)] rounded-[3px] border border-[var(--border)] shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">Notifications</h3>
                            {unread > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                                    {unread} new
                                </span>
                            )}
                        </div>
                        {unread > 0 && (
                            <button onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors font-medium">
                                <CheckCheck className="h-4 w-4" /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="h-8 w-8 text-[var(--border)] mx-auto mb-2" />
                                <p className="text-sm text-[var(--text-muted)]">No notifications yet</p>
                            </div>
                        ) : (
                            <>
                                {unreadNotifs.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight px-4 py-2 bg-[var(--bg-base)]">New</p>
                                        {unreadNotifs.map(n => (
                                            <NotifItem
                                                key={n.id}
                                                notif={n}
                                                onAccept={handleAccept}
                                                onDecline={handleDecline}
                                                actionLoading={actionLoading}
                                            />
                                        ))}
                                    </div>
                                )}
                                {readNotifs.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight px-4 py-2 bg-[var(--bg-base)]">Earlier</p>
                                        {readNotifs.slice(0, 10).map(n => (
                                            <NotifItem
                                                key={n.id}
                                                notif={n}
                                                onAccept={handleAccept}
                                                onDecline={handleDecline}
                                                actionLoading={actionLoading}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function NotifItem({ notif, onAccept, onDecline, actionLoading }: any) {
    const payload = notif.payload || {};
    const isTeamInvite = notif.type === 'TEAM_INVITE';
    const isAccepted = notif._accepted || (notif.read && payload.status === 'ACCEPTED');
    const isDeclined = notif._declined;
    const inviteHandled = isAccepted || isDeclined;

    return (
        <div className={cn(
            "px-4 py-3 border-b border-[var(--border)] last:border-0 transition-colors",
            !notif.read ? "bg-[var(--color-primary-light)]/20" : "hover:bg-[var(--bg-surface-2)]"
        )}>
            <div className="flex items-start gap-3">
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    isTeamInvite ? "bg-blue-100 text-[var(--color-primary)]" : "bg-slate-100 text-[var(--text-secondary)]"
                )}>
                    <Users className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] leading-snug font-medium">
                        {payload.message || 'New notification'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                    </p>

                    {/* Accept / Decline buttons for pending team invites */}
                    {isTeamInvite && !notif.read && !inviteHandled && (
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => onAccept(notif)}
                                disabled={!!actionLoading}
                                className="jira-button jira-button-primary text-xs"
                            >
                                {actionLoading === notif.id + 'accept' ? 'Joining...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => onDecline(notif)}
                                disabled={!!actionLoading}
                                className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] text-xs"
                            >
                                {actionLoading === notif.id + 'decline' ? 'Declining...' : 'Decline'}
                            </button>
                        </div>
                    )}

                    {isTeamInvite && isAccepted && (
                        <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Joined team
                        </p>
                    )}
                    {isTeamInvite && isDeclined && (
                        <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                            <X className="h-3 w-3" /> Declined
                        </p>
                    )}
                </div>
                {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 mt-2" />
                )}
            </div>
        </div>
    );
}
