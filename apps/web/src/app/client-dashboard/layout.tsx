"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, FolderOpen, FileText, MessageSquare, Target, Settings, HelpCircle, LogOut, Plus, Bell } from 'lucide-react';

const nav = [
  { href: '/client-dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/client-dashboard/projects', label: 'Projects', icon: FolderOpen },
  { href: '/client-dashboard/deliverables', label: 'Deliverables', icon: FileText },
  { href: '/client-dashboard/feedback', label: 'Feedback', icon: MessageSquare },
  { href: '/client-dashboard/milestones', label: 'Milestones', icon: Target },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.replace('/login'); return; }
    const u = JSON.parse(stored);
    const role = (u.roles?.[0] || '').toUpperCase();
    if (role !== 'CLIENT') { router.replace('/dashboard'); return; }
    setUser(u);
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname?.startsWith(href + '/');

  if (!user) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }} />
    </div>
  );

  const initials = user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'C';
  const company = user.organization || 'Client';

  return (
    <div className="flex h-screen bg-white overflow-hidden" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      {/* Sidebar */}
      <aside className="w-52 flex flex-col border-r shrink-0" style={{ borderColor: '#f1f5f9' }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: '#f1f5f9' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>E</div>
            <div>
              <p className="font-bold text-sm leading-none" style={{ color: '#0f172a' }}>ESMP Portal</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#94a3b8' }}>EXECUTIVE ATELIER</p>
            </div>
          </div>
        </div>

        {/* New Request button */}
        <div className="px-4 py-4">
          <Link href="/client-dashboard/feedback?new=1"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            <Plus className="h-4 w-4" /> New Request
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {nav.map(item => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: active ? '#2563eb' : '#64748b',
                  background: active ? '#eff6ff' : 'transparent',
                  fontWeight: active ? 600 : 500,
                }}>
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: '#f1f5f9' }}>
          <Link href="/client-dashboard/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: '#64748b' }}>
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-colors"
            style={{ color: '#64748b' }}>
            <HelpCircle className="h-4 w-4" /> Support
          </button>
          {/* User */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-2 rounded-xl" style={{ background: '#f8fafc' }}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>{initials}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#0f172a' }}>{user.name}</p>
              <p className="text-[10px] truncate" style={{ color: '#94a3b8' }}>{company}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="shrink-0 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-8 border-b shrink-0" style={{ borderColor: '#f1f5f9' }}>
          <div className="flex items-center gap-6">
            {nav.map(item => (
              <Link key={item.href} href={item.href}
                className="text-sm font-medium transition-colors pb-0.5"
                style={{
                  color: isActive(item.href, item.exact) ? '#2563eb' : '#64748b',
                  borderBottom: isActive(item.href, item.exact) ? '2px solid #2563eb' : '2px solid transparent',
                }}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg transition-colors hover:bg-slate-100">
              <Bell className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: '#64748b' }} />
            </button>
            <Link href="/client-dashboard/deliverables"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
              Review Deliverables
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>

        {/* Footer */}
        <div className="px-8 py-3 border-t flex items-center justify-between" style={{ borderColor: '#f1f5f9' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#94a3b8' }}>
            <span>🔒</span>
            <span>Enterprise-grade encryption active. Your data is handled according to ESMP Security Protocols v4.2.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
