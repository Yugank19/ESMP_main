"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Ticket, GitBranch, Clock, Megaphone, AlertTriangle, ArrowRight , ArrowLeft} from 'lucide-react';
import Link from 'next/link';
import { getMyWorkload } from '@/lib/workload-api';
import { getTicketStats } from '@/lib/tickets-api';
import { getAnnouncements } from '@/lib/company-announcements-api';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'lozenge-default', MEDIUM: 'lozenge-info', HIGH: 'lozenge-warning', URGENT: 'lozenge-danger',
  CRITICAL: 'lozenge-danger',
};
const STATUS_COLORS: Record<string, string> = {
  TODO: 'lozenge-default', IN_PROGRESS: 'lozenge-warning', REVIEW: 'lozenge-info', COMPLETED: 'lozenge-success',
};

export default function MyWorkspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workload, setWorkload] = useState<any>(null);
  const [ticketStats, setTicketStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if ((u.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    setUser(u);
    load();
  }, []);

  async function load() {
    try {
      const [w, ts, ann] = await Promise.all([
        getMyWorkload(),
        getTicketStats(),
        getAnnouncements({}),
      ]);
      setWorkload(w);
      setTicketStats(ts);
      setAnnouncements(Array.isArray(ann) ? ann.slice(0, 4) : []);
    } catch {}
    setLoading(false);
  }

  if (!user || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--jira-blue)', borderTopColor: 'transparent' }} />
    </div>
  );

  const summaryCards = [
    { label: 'Active Tasks', value: workload?.activeTasks?.length ?? 0, icon: CheckSquare, color: '#0052CC', bg: '#DEEBFF', href: '/dashboard/tasks' },
    { label: 'My Tickets', value: ticketStats?.total ?? 0, icon: Ticket, color: '#00875A', bg: '#E3FCEF', href: '/dashboard/tickets' },
    { label: 'Pending Approvals', value: workload?.pendingApprovals ?? 0, icon: GitBranch, color: '#FF8B00', bg: '#FFFAE6', href: '/dashboard/approvals' },
    { label: 'Hours This Week', value: `${(workload?.hoursThisWeek || 0).toFixed(1)}h`, icon: Clock, color: '#6554C0', bg: '#EAE6FF', href: '/dashboard/time-tracking' },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="rounded p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0052CC 0%, #0747A6 60%, #172B4D 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative">
          <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl font-bold text-white mb-1">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.name.split(' ')[0]}</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {workload?.overdueTasks > 0
              ? `You have ${workload.overdueTasks} overdue task${workload.overdueTasks > 1 ? 's' : ''} that need attention.`
              : 'Your workspace is up to date. Keep up the great work.'}
          </p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex gap-3">
          <Link href="/dashboard/tickets"
            className="px-4 py-2 rounded text-sm font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors">
            Raise a Request
          </Link>
          <Link href="/dashboard/time-tracking"
            className="px-4 py-2 rounded text-sm font-semibold bg-white hover:bg-blue-50 transition-colors"
            style={{ color: '#0052CC' }}>
            Log Time
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(c => (
          <Link key={c.label} href={c.href}
            className="rounded p-5 flex flex-col gap-3 group transition-all"
            style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-e200)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-e100)')}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: c.bg }}>
                <c.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: c.color }} />
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{c.value}</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* My Tasks */}
        <div className="xl:col-span-2 rounded" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>My Active Tasks</h2>
            <Link href="/dashboard/tasks" className="text-xs font-semibold hover:underline" style={{ color: 'var(--jira-blue)' }}>View all</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {!workload?.activeTasks?.length ? (
              <div className="p-8 text-center">
                <CheckSquare className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active tasks assigned</p>
              </div>
            ) : workload.activeTasks.map((task: any) => (
              <div key={task.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {task.team?.name}
                    {task.due_date && ` · Due ${new Date(task.due_date).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`lozenge ${PRIORITY_COLORS[task.priority] || 'lozenge-default'}`}>{task.priority}</span>
                  <span className={`lozenge ${STATUS_COLORS[task.status] || 'lozenge-default'}`}>{task.status?.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        <div className="rounded" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Company News</h2>
            <Link href="/dashboard/company-news" className="text-xs font-semibold hover:underline" style={{ color: 'var(--jira-blue)' }}>View all</Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {announcements.length === 0 ? (
              <div className="p-8 text-center">
                <Megaphone className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No announcements</p>
              </div>
            ) : announcements.map(a => (
              <div key={a.id} className="px-5 py-3"
                style={{ borderLeft: a.type === 'URGENT' ? '3px solid #DE350B' : a.is_pinned ? '3px solid var(--jira-blue)' : '3px solid transparent' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`lozenge text-[10px] ${a.type === 'URGENT' ? 'lozenge-danger' : a.type === 'POLICY' ? 'lozenge-info' : 'lozenge-default'}`}>{a.type}</span>
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{a.body}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded p-5" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'New Ticket', href: '/dashboard/tickets', icon: Ticket, color: '#0052CC', bg: '#DEEBFF' },
            { label: 'Log Time', href: '/dashboard/time-tracking', icon: Clock, color: '#6554C0', bg: '#EAE6FF' },
            { label: 'Approvals', href: '/dashboard/approvals', icon: GitBranch, color: '#FF8B00', bg: '#FFFAE6' },
            { label: 'Report Bug', href: '/dashboard/bugs', icon: AlertTriangle, color: '#DE350B', bg: '#FFEBE6' },
            { label: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: CheckSquare, color: '#00875A', bg: '#E3FCEF' },
            { label: 'Company News', href: '/dashboard/company-news', icon: Megaphone, color: '#0052CC', bg: '#DEEBFF' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="flex flex-col items-center gap-2 p-4 rounded text-center transition-all"
              style={{ background: 'var(--bg-surface-2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = a.bg)}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}>
              <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: a.bg }}>
                <a.icon className="h-5 w-5" style={{ color: a.color }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
