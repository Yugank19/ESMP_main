"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FolderOpen, FileText, MessageSquare, Target,
  LogOut, Bell, ChevronDown, User, Settings, X, CheckCheck,
  Search, Menu, Building2
} from 'lucide-react';
import { getClientNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/client-portal-api';

const nav = [
  { href: '/client-dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/client-dashboard/projects', label: 'Projects', icon: FolderOpen },
  { href: '/client-dashboard/deliverables', label: 'Deliverables', icon: FileText },
  { href: '/client-dashboard/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/client-dashboard/milestones', label: 'Milestones', icon: Target },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.replace('/login'); return; }
    const u = JSON.parse(stored);
    const role = (u.roles?.[0] || '').toUpperCase();
    if (role !== 'CLIENT') { router.replace('/dashboard'); return; }
    setUser(u);
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadNotifications() {
    try { const d = await getClientNotifications(); setNotifications(Array.isArray(d) ? d : []); } catch {}
  }

  async function handleMarkAllRead() {
    try { await markAllNotificationsRead(); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); } catch {}
  }

  async function handleMarkRead(id: string) {
    try { await markNotificationRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); } catch {}
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(href + '/');

  const unread = notifications.filter(n => !n.read).length;
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'C';

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 flex flex-col bg-[#0f172a] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>E</div>
          <div>
            <p className="text-white font-bold text-sm leading-none">ESMP Portal</p>
            <p className="text-slate-500 text-[10px] mt-0.5">Client Workspace</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-500 hover:text-white lg:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User card */}
        <div className="mx-3 mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
              {user.avatar_url ? <img src={user.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" /> : initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.name}</p>
              <p className="text-slate-400 text-[10px] truncate">{user.organization || 'Client'}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {nav.map(item => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-[#2563eb] text-white' : 'text-slate-400 hover:text-white hover:bg-white/8'}`}>
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <Link href="/client-dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 transition-all">
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-white/8 transition-all w-full text-left">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 shrink-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
            <Menu className="h-5 w-5 text-slate-600" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400">{user.organization || 'Client Portal'}</span>
          </div>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5 text-slate-600" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                  {unread > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-sm text-slate-400">No notifications</div>
                  ) : notifications.slice(0, 20).map(n => (
                    <div key={n.id} onClick={() => handleMarkRead(n.id)}
                      className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                      <p className="text-sm text-slate-800 font-medium">{n.payload?.message || n.type}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                      {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                {user.avatar_url ? <img src={user.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" /> : initials}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.name?.split(' ')[0]}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-semibold text-sm text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <div className="p-1">
                  <Link href="/client-dashboard/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <User className="h-4 w-4 text-slate-400" /> Profile & Settings
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
