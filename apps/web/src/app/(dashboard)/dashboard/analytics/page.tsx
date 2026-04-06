"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
    Users, CheckSquare, AlertCircle, TrendingUp, FileText, 
    MessageSquare, Target, Clock, ChevronDown, Filter, 
    Download, Calendar, LayoutDashboard, Zap
} from 'lucide-react';
import { getGlobalAnalytics, getTeamAnalytics } from '@/lib/analytics-api';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#0052CC', '#36B37E', '#FFAB00', '#FF5630', '#6554C0', '#00B8D9'];

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [global, setGlobal] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    loadGlobal();
  }, []);

  useEffect(() => {
    if (selectedTeam) loadTeamAnalytics(selectedTeam);
  }, [selectedTeam]);

  async function loadGlobal() {
    try {
      const [g, teamsRes] = await Promise.all([
        getGlobalAnalytics(),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/teams`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json()),
      ]);
      setGlobal(g);
      const teamList = Array.isArray(teamsRes) ? teamsRes : [];
      setTeams(teamList);
      if (teamList.length > 0) setSelectedTeam(teamList[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadTeamAnalytics(teamId: string) {
    try {
      const data = await getTeamAnalytics(teamId);
      setTeamData(data);
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
    </div>
  );

  const overview = global || {};

  const globalStats = [
    { label: 'Total Teams', value: overview.totalTeams ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Tasks', value: overview.totalTasks ?? 0, icon: CheckSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed', value: overview.completedTasks ?? 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Overdue', value: overview.overdueTasks ?? 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Files Shared', value: overview.totalFiles ?? 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Alerts', value: overview.unreadNotifications ?? 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="flex flex-col space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics & Reports</h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Real-time performance metrics across your organization
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] gap-2 font-bold uppercase text-[10px]">
                    <Download className="h-4 w-4" /> Export JSON
                </button>
                <div className="w-[1px] h-6 bg-[var(--border)] mx-1" />
                {teams.length > 0 && (
                    <div className="relative">
                        <select
                            value={selectedTeam}
                            onChange={e => setSelectedTeam(e.target.value)}
                            className="appearance-none bg-white border border-[var(--border)] rounded-[3px] pl-3 pr-10 py-2 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer"
                        >
                            {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                )}
            </div>
        </div>

        {/* Filters & Tabs Placeholder */}
        <div className="flex items-center gap-4 border-b border-[var(--border)]">
            <button className="pb-3 text-sm font-bold text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]">Overview</button>
            <button className="pb-3 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Team Performance</button>
            <button className="pb-3 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Resource Allocation</button>
        </div>
      </div>

      {/* Global stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {globalStats.map(s => (
          <div key={s.label} className="card p-5 group hover:border-[var(--color-primary)] transition-all">
            <div className={cn("w-10 h-10 rounded-[3px] flex items-center justify-center mb-4 transition-transform group-hover:scale-110", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{s.value}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Rate Gauge */}
        <div className="card p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-8 self-start">Overall Efficiency</h3>
            <div className="relative w-40 h-40">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-surface-3)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-primary)" strokeWidth="8"
                        strokeDasharray={`${(overview.completionRate ?? 0) * 2.64} 264`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-[var(--text-primary)]">{overview.completionRate ?? 0}%</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase mt-1">COMPLETED</span>
                </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 w-full border-t border-[var(--border)] pt-6">
                <div className="text-center">
                    <p className="text-xl font-bold text-[var(--text-primary)]">{overview.completedTasks ?? 0}</p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Successful</p>
                </div>
                <div className="text-center border-l border-[var(--border)]">
                    <p className="text-xl font-bold text-red-600">{overview.overdueTasks ?? 0}</p>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Overdue</p>
                </div>
            </div>
        </div>

        {/* Task trend chart */}
        <div className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Task Velocity (Last 14 Days)</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)]">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#0052CC]" /> Created</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#36B37E]" /> Completed</div>
                </div>
            </div>
            {teamData?.taskTrend ? (
                <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={teamData.taskTrend}>
                        <defs>
                            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0052CC" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#0052CC" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#36B37E" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#36B37E" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 'bold' }} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '3px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="created" stroke="#0052CC" strokeWidth={3} fillOpacity={1} fill="url(#colorCreated)" name="Tasks Created" />
                        <Area type="monotone" dataKey="completed" stroke="#36B37E" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" name="Tasks Completed" />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[260px] flex items-center justify-center text-[var(--text-muted)] italic text-sm">No trend data available</div>
            )}
        </div>
      </div>

      {/* Resource Allocation & Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Member productivity bar chart */}
         <div className="card p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-8">Workload Distribution</h3>
            {teamData?.memberProductivity?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={teamData.memberProductivity} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontWeight: 'bold' }} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-primary)', fontWeight: 'bold' }} width={80} />
                        <Tooltip cursor={{ fill: 'var(--bg-surface-2)' }} contentStyle={{ borderRadius: '3px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                        <Legend iconType="rect" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                        <Bar dataKey="assigned" fill="#0052CC" radius={[0, 3, 3, 0]} name="Assigned" barSize={12} />
                        <Bar dataKey="completed" fill="#36B37E" radius={[0, 3, 3, 0]} name="Completed" barSize={12} />
                        <Bar dataKey="overdue" fill="#FF5630" radius={[0, 3, 3, 0]} name="Overdue" barSize={12} />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-[280px] flex items-center justify-center text-[var(--text-muted)] italic text-sm">No productivity data available</div>
            )}
        </div>

        {/* Status Breakdown Pie */}
        <div className="card p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-8">Service Delivery Status</h3>
            {teamData?.taskStatusBreakdown?.length > 0 ? (
                <div className="flex items-center">
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie 
                                data={teamData.taskStatusBreakdown} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={70} 
                                outerRadius={100} 
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {teamData.taskStatusBreakdown.map((entry: any, i: number) => (
                                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '3px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="w-48 space-y-3">
                        {teamData.taskStatusBreakdown.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">{entry.name}</span>
                                </div>
                                <span className="text-xs font-bold text-[var(--text-primary)]">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="h-[280px] flex items-center justify-center text-[var(--text-muted)] italic text-sm">No breakdown data available</div>
            )}
        </div>
      </div>

      {/* Member Performance Table */}
      {teamData?.memberProductivity?.length > 0 && (
        <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Contributor Performance</h3>
                <button className="text-[10px] font-bold text-[var(--color-primary)] hover:underline uppercase tracking-wider">View Full Roster</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--border)]">
                            {['Contributor', 'Workforce Role', 'Assigned', 'Outcome', 'Risk', 'Engagement'].map(h => (
                                <th key={h} className="text-left py-3 px-6 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {teamData.memberProductivity.map((m: any) => (
                            <tr key={m.userId} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)] transition-colors">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-[10px] font-bold">
                                            {m.name?.[0]}
                                        </div>
                                        <span className="font-bold text-[var(--text-primary)]">{m.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">{m.role}</span>
                                </td>
                                <td className="py-4 px-6 text-[var(--text-secondary)] font-medium">{m.assigned}</td>
                                <td className="py-4 px-6 text-emerald-600 font-bold">{m.completed}</td>
                                <td className="py-4 px-6 text-red-500 font-bold">{m.overdue}</td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 w-24 h-1.5 bg-[var(--bg-surface-3)] rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-700" style={{ width: `${m.completionRate}%` }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-[var(--text-primary)] w-8">{m.completionRate}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Recent activity stream */}
      {teamData?.recentActivity?.length > 0 && (
        <div className="card p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-6">Real-time Stream</h3>
            <div className="space-y-6">
                {teamData.recentActivity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-4 group">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-2)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--color-primary)] text-[10px] font-bold z-10 relative">
                            {a.user?.name?.[0] ?? '?'}
                        </div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[1px] h-[calc(100%+24px)] bg-[var(--border)] group-last:hidden" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm text-[var(--text-primary)] leading-tight">
                            <span className="font-bold">{a.user?.name}</span> {a.action}
                        </p>
                        {a.description && <p className="text-xs text-[var(--text-secondary)] mt-1.5 italic transition-colors group-hover:text-[var(--text-primary)]">{a.description}</p>}
                        <div className="flex items-center gap-2 mt-2">
                             <Clock className="h-3 w-3 text-[var(--text-muted)]" />
                             <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">{new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
