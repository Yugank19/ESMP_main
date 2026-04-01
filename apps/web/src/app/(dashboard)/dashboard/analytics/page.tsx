"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, CheckSquare, AlertCircle, TrendingUp, FileText, MessageSquare, Target, Clock } from 'lucide-react';
import { getGlobalAnalytics, getTeamAnalytics } from '@/lib/analytics-api';

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
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
    </div>
  );

  const overview = global || {};

  const globalStats = [
    { label: 'Teams', value: overview.totalTeams ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Tasks', value: overview.totalTasks ?? 0, icon: CheckSquare, color: 'bg-green-50 text-green-600' },
    { label: 'Completed', value: overview.completedTasks ?? 0, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Overdue', value: overview.overdueTasks ?? 0, icon: AlertCircle, color: 'bg-red-50 text-red-600' },
    { label: 'Files', value: overview.totalFiles ?? 0, icon: FileText, color: 'bg-purple-50 text-purple-600' },
    { label: 'Unread Alerts', value: overview.unreadNotifications ?? 0, icon: MessageSquare, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Analytics</h1>
          <p className="text-[15px] text-[#64748B] mt-0.5">Performance overview across all your teams</p>
        </div>
        {teams.length > 0 && (
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
          >
            {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {globalStats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-[#0F172A]">{s.value}</p>
            <p className="text-xs text-[#64748B] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Completion rate */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex flex-col items-center justify-center">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1D4ED8" strokeWidth="10"
                strokeDasharray={`${(overview.completionRate ?? 0) * 2.51} 251`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#0F172A]">{overview.completionRate ?? 0}%</span>
            </div>
          </div>
          <p className="text-[15px] font-semibold text-[#0F172A] mt-3">Completion Rate</p>
          <p className="text-xs text-[#64748B]">Across all teams</p>
        </div>

        {teamData && (
          <div className="lg:col-span-3 bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h2 className="text-[15px] font-semibold text-[#0F172A] mb-4">Task Status Breakdown</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={teamData.taskStatusBreakdown} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {teamData.taskStatusBreakdown.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Task trend chart */}
      {teamData?.taskTrend && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-[15px] font-semibold text-[#0F172A] mb-4">Task Activity â€” Last 14 Days</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={teamData.taskTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#3B82F6" strokeWidth={2} dot={false} name="Created" />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} dot={false} name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Member productivity */}
      {teamData?.memberProductivity && teamData.memberProductivity.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-[15px] font-semibold text-[#0F172A] mb-4">Member Productivity</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={teamData.memberProductivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="assigned" fill="#3B82F6" name="Assigned" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="overdue" fill="#EF4444" name="Overdue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Member table */}
      {teamData?.memberProductivity && teamData.memberProductivity.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-[15px] font-semibold text-[#0F172A] mb-4">Member Performance Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Member', 'Role', 'Assigned', 'Completed', 'Overdue', 'Comments', 'Files', 'Rate'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamData.memberProductivity.map((m: any) => (
                  <tr key={m.userId} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="py-3 px-3 font-medium text-[#0F172A]">{m.name}</td>
                    <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{m.role}</span></td>
                    <td className="py-3 px-3 text-[#64748B]">{m.assigned}</td>
                    <td className="py-3 px-3 text-emerald-600 font-medium">{m.completed}</td>
                    <td className="py-3 px-3 text-red-500">{m.overdue}</td>
                    <td className="py-3 px-3 text-[#64748B]">{m.comments}</td>
                    <td className="py-3 px-3 text-[#64748B]">{m.files}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1D4ED8] rounded-full" style={{ width: `${m.completionRate}%` }} />
                        </div>
                        <span className="text-xs font-medium text-[#0F172A]">{m.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {teamData?.recentActivity && teamData.recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-[15px] font-semibold text-[#0F172A] mb-4">Recent Team Activity</h2>
          <div className="space-y-3">
            {teamData.recentActivity.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1D4ED8] flex items-center justify-center shrink-0 text-white text-xs font-bold">
                  {a.user?.name?.[0] ?? '?'}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] text-[#0F172A]"><span className="font-medium">{a.user?.name}</span> {a.action}</p>
                  {a.description && <p className="text-xs text-[#64748B]">{a.description}</p>}
                </div>
                <span className="text-xs text-[#94A3B8] shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {teams.length === 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
          <Target className="h-10 w-10 text-[#94A3B8] mx-auto mb-3" />
          <p className="text-[15px] font-medium text-[#0F172A]">No teams yet</p>
          <p className="text-sm text-[#64748B] mt-1">Join or create a team to see analytics</p>
        </div>
      )}
    </div>
  );
}
