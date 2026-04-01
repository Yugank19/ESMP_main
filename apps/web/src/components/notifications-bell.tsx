"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Users, Check, X, CheckCheck } from 'lucide-react';
import { notificationsApi } from '@/lib/notifications-api';

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
                className="relative p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"
            >
                <Bell className="h-4 w-4 text-[#64748B]" />
                {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#1D4ED8] text-white text-[9px] font-bold flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-10 w-96 bg-white rounded-xl border border-[#E2E8F0] shadow-2xl shadow-slate-200/60 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[#0F172A]">Notifications</h3>
                            {unread > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8]">
                                    {unread} new
                                </span>
                            )}
                        </div>
                        {unread > 0 && (
                            <button onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#1D4ED8] transition-colors">
                                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="h-8 w-8 text-[#E2E8F0] mx-auto mb-2" />
                                <p className="text-sm text-[#94A3B8]">No notifications yet</p>
                            </div>
                        ) : (
                            <>
                                {unreadNotifs.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider px-4 py-2 bg-[#F8FAFC]">New</p>
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
                                        <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider px-4 py-2 bg-[#F8FAFC]">Earlier</p>
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
        <div className={`px-4 py-3 border-b border-[#F8FAFC] last:border-0 ${!notif.read ? 'bg-[#EFF6FF]/30' : ''}`}>
            <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isTeamInvite ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Users className={`h-4 w-4 ${isTeamInvite ? 'text-[#1D4ED8]' : 'text-[#64748B]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0F172A] leading-snug">
                        {payload.message || 'New notification'}
                    </p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                        {new Date(notif.created_at).toLocaleString()}
                    </p>

                    {/* Accept / Decline buttons for pending team invites */}
                    {isTeamInvite && !notif.read && !inviteHandled && (
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => onAccept(notif)}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                            >
                                <Check className="h-3 w-3" />
                                {actionLoading === notif.id + 'accept' ? 'Joining...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => onDecline(notif)}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 px-3 py-1.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#64748B] text-xs font-semibold rounded-lg transition disabled:opacity-50"
                            >
                                <X className="h-3 w-3" />
                                {actionLoading === notif.id + 'decline' ? 'Declining...' : 'Decline'}
                            </button>
                        </div>
                    )}

                    {isTeamInvite && isAccepted && (
                        <p className="text-xs text-green-600 font-medium mt-1.5 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Joined team
                        </p>
                    )}
                    {isTeamInvite && isDeclined && (
                        <p className="text-xs text-[#94A3B8] mt-1.5 flex items-center gap-1">
                            <X className="h-3 w-3" /> Declined
                        </p>
                    )}
                </div>
                {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-[#1D4ED8] shrink-0 mt-1.5" />
                )}
            </div>
        </div>
    );
}
