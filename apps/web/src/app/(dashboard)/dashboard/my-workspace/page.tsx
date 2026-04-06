"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    CheckSquare, Ticket, GitBranch, Clock, Megaphone, 
    AlertTriangle, ArrowRight, ArrowLeft, Zap, Target,
    Layout, Briefcase, Globe, Activity, ShieldCheck,
    Terminal, MoreHorizontal, Send, FileText, Calendar,
    User, Star, Bell, Info
} from 'lucide-react';
import Link from 'next/link';
import { getMyWorkload } from '@/lib/workload-api';
import { getTicketStats } from '@/lib/tickets-api';
import { getAnnouncements } from '@/lib/company-announcements-api';
import { cn } from '@/lib/utils';

const PRIORITY_META: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100' },
  MEDIUM: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  HIGH: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  URGENT: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const STATUS_META: Record<string, { bg: string; text: string; border: string }> = {
  TODO: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  IN_PROGRESS: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  REVIEW: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
};

export default function MyWorkspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workload, setWorkload] = useState<any>(null);
  const [ticketStats, setTicketStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
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
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if ((u.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    setUser(u);
    load();
  }, [load, router]);

  if (!user || loading) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 opacity-40">
      <div className="h-10 w-10 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Synchronizing Personal Workspace HUD...</span>
    </div>
  );

  const summaryCards = [
    { label: 'Active Missions', value: workload?.activeTasks?.length ?? 0, icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', href: '/dashboard/tasks' },
    { label: 'Open Requests', value: ticketStats?.total ?? 0, icon: Ticket, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', href: '/dashboard/tickets' },
    { label: 'Pending Auth', value: workload?.pendingApprovals ?? 0, icon: GitBranch, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', href: '/dashboard/approvals' },
    { label: 'Temporal Sync', value: `${(workload?.hoursThisWeek || 0).toFixed(1)}h`, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', href: '/dashboard/time-tracking' },
  ];

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Dynamic Welcome Terminal */}
      <div className="rounded-[3px] p-10 relative overflow-hidden bg-slate-900 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, var(--color-primary) 0%, transparent 60%)' }} />
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Terminal className="h-48 w-48 text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-white/10 text-white/60 text-[9px] font-black rounded-[2px] uppercase tracking-[0.2em] border border-white/10">
                    Temporal Point: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-emerald-500/50 shadow-lg" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">
                Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, <span className="text-[var(--color-primary)]">{user.name.split(' ')[0]}</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-400 mt-4 uppercase tracking-[0.1em] max-w-xl leading-relaxed">
              {workload?.overdueTasks > 0
                ? `SECURITY_ALERT: YOU HAVE ${workload.overdueTasks} OVERDUE PROTOCOLS REQUIRING IMMEDIATE TRIAGE.`
                : 'WORKSPACE_STATUS: OPTIMAL. ALL SYSTEMS NOMINAL. MISSION CONTINUITY CONFIRMED.'}
            </p>
          </div>
          
          <div className="flex gap-4 shrink-0">
            <Link href="/dashboard/tickets"
              className="px-8 h-12 rounded-[3px] text-[10px] font-black text-white border-2 border-white/10 hover:bg-white/5 transition-all flex items-center gap-3 uppercase tracking-widest shadow-lg">
              <Send className="h-4 w-4" /> Raise Request
            </Link>
            <Link href="/dashboard/time-tracking"
              className="px-8 h-12 rounded-[3px] text-[10px] font-black bg-[var(--color-primary)] hover:bg-blue-700 text-white transition-all flex items-center gap-3 uppercase tracking-widest shadow-xl shadow-blue-900/40">
              <Clock className="h-4 w-4" /> Log Temporal Units
            </Link>
          </div>
        </div>
      </div>

      {/* Personnel Intelligence HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map(c => (
          <Link key={c.label} href={c.href}
            className="card p-6 flex flex-col gap-6 group hover:border-[var(--color-primary)] hover:shadow-xl transition-all border-[var(--border)] relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className={cn("w-12 h-12 rounded-[3px] flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110", c.bg, c.border)}>
                <c.icon className={cn("h-6 w-6", c.color)} />
              </div>
              <ArrowRight className="h-5 w-5 text-slate-200 group-hover:text-[var(--color-primary)] group-hover:translate-x-2 transition-all" />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{c.value}</p>
              <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest mt-1">{c.label}</p>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mt-1">REAL_TIME_SYNC_ACTIVE</p>
            </div>
            <div className="absolute -bottom-2 -right-2 text-[48px] font-black text-slate-50 pointer-events-none group-hover:text-blue-50/50 transition-colors uppercase select-none">
                {c.label.substring(0, 2)}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Active Protocols Terminal */}
        <div className="xl:col-span-2 card p-0 overflow-hidden shadow-sm border-[var(--border)]">
          <div className="flex items-center justify-between px-8 py-5 bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
                 <Terminal className="h-4 w-4 text-[var(--color-primary)]" />
                 <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Active Mission Protocols</h2>
            </div>
            <Link href="/dashboard/tasks" className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest hover:translate-x-2 transition-transform flex items-center gap-2">LOG_VIEW_ALL <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-slate-100">
            {!workload?.activeTasks?.length ? (
              <div className="p-20 text-center flex flex-col items-center opacity-30">
                <CheckSquare className="h-16 w-16 text-[var(--text-muted)] mb-6 stroke-[1px]" />
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Zero Active Task Signatures Detected</p>
              </div>
            ) : workload.activeTasks.map((task: any) => (
              <div key={task.id} className="px-8 py-5 flex items-center justify-between gap-6 group hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight group-hover:text-[var(--color-primary)] transition-colors truncate">{task.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Briefcase className="h-3 w-3 text-slate-300" /> {task.team?.name}
                    </span>
                    {task.due_date && (
                        <>
                            <span className="text-slate-200">·</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar className="h-3 w-3 text-slate-300" /> {new Date(task.due_date).toLocaleDateString()}
                            </span>
                        </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {task.priority && (
                      <span className={cn(
                          "px-2.5 py-1 text-[8px] font-black border rounded-[2px] uppercase tracking-widest",
                          PRIORITY_META[task.priority]?.bg, PRIORITY_META[task.priority]?.text, PRIORITY_META[task.priority]?.border
                      )}>{task.priority}</span>
                  )}
                  {task.status && (
                      <span className={cn(
                          "px-2.5 py-1 text-[8px] font-black border rounded-[2px] uppercase tracking-widest",
                          STATUS_META[task.status]?.bg, STATUS_META[task.status]?.text, STATUS_META[task.status]?.border
                      )}>{task.status?.replace('_', ' ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Broadcast Hub */}
        <div className="card p-0 overflow-hidden shadow-sm border-[var(--border)]">
          <div className="flex items-center justify-between px-8 py-5 bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
                 <Megaphone className="h-4 w-4 text-[var(--color-primary)]" />
                 <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Intelligence Dispatch</h2>
            </div>
            <Link href="/dashboard/company-news" className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest hover:translate-x-2 transition-transform flex items-center gap-2">X_FEED <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-slate-100 bg-slate-50/10">
            {announcements.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center opacity-30">
                <Globe className="h-16 w-16 text-[var(--text-muted)] mb-6 stroke-[1px]" />
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">No Global Signals Detected</p>
              </div>
            ) : announcements.map(a => (
              <div key={a.id} className={cn(
                  "px-8 py-6 transition-all hover:bg-white group relative overflow-hidden",
                  a.type === 'URGENT' ? 'border-l-4 border-l-red-500' : a.is_pinned ? 'border-l-4 border-l-[var(--color-primary)]' : 'border-l-4 border-l-transparent'
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={cn(
                      "px-2 py-0.5 text-[8px] font-black border rounded-[2px] uppercase tracking-[0.2em] shadow-xs",
                      a.type === 'URGENT' ? 'bg-red-50 border-red-100 text-red-600' : a.type === 'POLICY' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-500'
                  )}>{a.type}</span>
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter tabular-nums">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight mb-2 group-hover:text-[var(--color-primary)] transition-colors">{a.title}</p>
                <p className="text-[11px] font-medium text-slate-400 line-clamp-2 leading-relaxed uppercase tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">{a.body}</p>
                
                <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-100 transition-opacity">
                    <Zap className={cn("h-4 w-4", a.type === 'URGENT' ? "text-red-500" : "text-[var(--color-primary)]")} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Tactical Grid */}
      <div className="card p-8 border-[var(--border)] bg-slate-50/50 shadow-inner">
        <div className="flex items-center gap-3 mb-8">
             <Layout className="h-5 w-5 text-slate-400" />
             <h2 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.3em]">Operational Access Hub</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'New Ticket', href: '/dashboard/tickets', icon: Ticket, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
            { label: 'Sync Time', href: '/dashboard/time-tracking', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
            { label: 'Auth Panel', href: '/dashboard/approvals', icon: GitBranch, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
            { label: 'Bug Triage', href: '/dashboard/bugs', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
            { label: 'Intel Repo', href: '/dashboard/knowledge-base', icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
            { label: 'Status Feed', href: '/dashboard/company-news', icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="flex flex-col items-center gap-4 p-6 bg-white border border-slate-100 rounded-[3px] text-center transition-all hover:-translate-y-2 hover:shadow-xl hover:border-[var(--color-primary)] group">
              <div className={cn("w-12 h-12 rounded-[3px] flex items-center justify-center border shadow-inner transition-transform group-hover:rotate-12", a.bg, a.border)}>
                <a.icon className={cn("h-6 w-6", a.color)} />
              </div>
              <div className="space-y-1">
                  <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">{a.label}</span>
                  <p className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">DIRECT_LINK_CMD</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Footer Heuristic */}
      <div className="flex items-center justify-between pt-4 opacity-30">
          <div className="flex items-center gap-4">
               <Terminal className="h-4 w-4" />
               <span className="text-[9px] font-black uppercase tracking-[0.3em]">Personnel HUD v.5.0_PRO</span>
          </div>
          <div className="flex items-center gap-2">
               <ShieldCheck className="h-3.5 w-3.5" />
               <span className="text-[8px] font-black uppercase tracking-widest">Level 4 Auth Active</span>
          </div>
      </div>
    </div>
  );
}
