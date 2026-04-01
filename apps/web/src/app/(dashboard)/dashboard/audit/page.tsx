"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Filter, RefreshCw, Clock, Search, List, GitBranch,
  LogIn, LogOut, Users, CheckSquare, FileText, MessageSquare,
  Settings, Key, Megaphone, Target, Download
} from 'lucide-react';
import { getTeamAuditLogs, getActionTypes } from '@/lib/audit-api';

const ACTION_META: Record<string, { color: string; icon: any }> = {
  LOGIN:               { color: 'bg-green-50 text-green-700 border-green-200',   icon: LogIn },
  LOGOUT:              { color: 'bg-slate-50 text-slate-600 border-slate-200',   icon: LogOut },
  REGISTER:            { color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: Users },
  TEAM_CREATED:        { color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: Users },
  TEAM_UPDATED:        { color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: Users },
  TEAM_ARCHIVED:       { color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Users },
  TEAM_DELETED:        { color: 'bg-red-50 text-red-700 border-red-200',         icon: Users },
  MEMBER_JOINED:       { color: 'bg-green-50 text-green-700 border-green-200',   icon: Users },
  MEMBER_LEFT:         { color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Users },
  MEMBER_REMOVED:      { color: 'bg-red-50 text-red-700 border-red-200',         icon: Users },
  MEMBER_INVITED:      { color: 'bg-cyan-50 text-cyan-700 border-cyan-200',      icon: Users },
  ROLE_UPDATED:        { color: 'bg-purple-50 text-purple-700 border-purple-200',icon: Key },
  TASK_CREATED:        { color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: CheckSquare },
  TASK_UPDATED:        { color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: CheckSquare },
  TASK_DELETED:        { color: 'bg-red-50 text-red-700 border-red-200',         icon: CheckSquare },
  TASK_COMPLETED:      { color: 'bg-green-50 text-green-700 border-green-200',   icon: CheckSquare },
  FILE_UPLOADED:       { color: 'bg-indigo-50 text-indigo-700 border-indigo-200',icon: FileText },
  FILE_DELETED:        { color: 'bg-red-50 text-red-700 border-red-200',         icon: FileText },
  MESSAGE_SENT:        { color: 'bg-slate-50 text-slate-600 border-slate-200',   icon: MessageSquare },
  ANNOUNCEMENT_POSTED: { color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Megaphone },
  REPORT_GENERATED:    { color: 'bg-purple-50 text-purple-700 border-purple-200',icon: FileText },
  SETTINGS_CHANGED:    { color: 'bg-slate-50 text-slate-600 border-slate-200',   icon: Settings },
  PASSWORD_CHANGED:    { color: 'bg-red-50 text-red-700 border-red-200',         icon: Key },
  PROFILE_UPDATED:     { color: 'bg-blue-50 text-blue-700 border-blue-200',      icon: Users },
  MILESTONE_CREATED:   { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Target },
  PROGRESS_UPDATED:    { color: 'bg-green-50 text-green-700 border-green-200',   icon: CheckSquare },
};

function getMeta(action: string) {
  return ACTION_META[action] || { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: Shield };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function AuditPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timeline' | 'table'>('timeline');
  const [members, setMembers] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    userId: '', action: '', from: '', to: '', search: '', sort: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    loadTeams();
    loadActionTypes();
  }, []);

  useEffect(() => {
    if (selectedTeam) { loadLogs(); loadMembers(); }
  }, [selectedTeam]);

  async function loadTeams() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTeams(list);
      if (list.length > 0) setSelectedTeam(list[0].id);
    } finally { setLoading(false); }
  }

  async function loadActionTypes() {
    try {
      const data = await getActionTypes();
      setActionTypes(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function loadMembers() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/teams/${selectedTeam}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setMembers(data.members || []);
    } catch {}
  }

  const loadLogs = useCallback(async () => {
    if (!selectedTeam) return;
    setLoading(true);
    try {
      const f: Record<string, string> = { sort: filters.sort };
      if (filters.userId) f.userId = filters.userId;
      if (filters.action) f.action = filters.action;
      if (filters.from) f.from = filters.from;
      if (filters.to) f.to = filters.to;
      if (filters.search) f.search = filters.search;
      const data = await getTeamAuditLogs(selectedTeam, f);
      setLogs(Array.isArray(data) ? data : []);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }, [selectedTeam, filters]);

  function exportCSV() {
    const rows = [['Time', 'User', 'Action', 'Description']];
    logs.forEach(l => rows.push([
      new Date(l.created_at).toLocaleString(),
      l.user?.name || '',
      l.action || '',
      l.description || '',
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'activity-log.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const activeFilterCount = [filters.userId, filters.action, filters.from, filters.to, filters.search].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Activity Log</h1>
          <p className="text-[15px] text-[#64748B] mt-0.5">Complete audit trail of all team actions</p>
        </div>
        <div className="flex items-center gap-2">
          {teams.length > 0 && (
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-[15px] transition-colors ${showFilters ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}>
            <Filter className="h-4 w-4" />
            Filters {activeFilterCount > 0 && <span className="bg-[#1D4ED8] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <button onClick={loadLogs} className="p-2 border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 border border-[#E2E8F0] rounded-lg text-[15px] text-[#64748B] hover:bg-[#F8FAFC] transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
        <input
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && loadLogs()}
          placeholder="Search actions or descriptions... (press Enter)"
          className="w-full pl-10 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
        />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Member</label>
              <select value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                <option value="">All members</option>
                {members.map((m: any) => <option key={m.user_id} value={m.user_id}>{m.user?.name || m.user_id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Action Type</label>
              <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                <option value="">All actions</option>
                {Object.keys(ACTION_META).map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">From</label>
              <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">To</label>
              <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Sort</label>
              <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={loadLogs}
              className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg text-[15px] font-medium hover:bg-[#1e40af] transition-colors">
              Apply
            </button>
            <button onClick={() => { setFilters({ userId: '', action: '', from: '', to: '', search: '', sort: 'desc' }); }}
              className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg text-[15px] hover:bg-[#F8FAFC] transition-colors">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* View toggle + count */}
      <div className="flex items-center justify-between">
        <p className="text-[15px] text-[#64748B]">{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</p>
        <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-lg p-1">
          <button onClick={() => setView('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[15px] font-medium transition-colors ${view === 'timeline' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}>
            <GitBranch className="h-3.5 w-3.5" /> Timeline
          </button>
          <button onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[15px] font-medium transition-colors ${view === 'table' ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}>
            <List className="h-3.5 w-3.5" /> Table
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-[#E2E8F0]">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-7 w-7 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="h-10 w-10 text-[#94A3B8] mx-auto mb-3" />
            <p className="text-[15px] font-medium text-[#0F172A]">No activity found</p>
            <p className="text-sm text-[#64748B] mt-1">Actions will appear here as your team works</p>
          </div>
        ) : view === 'timeline' ? (
          <TimelineView logs={logs} />
        ) : (
          <TableView logs={logs} />
        )}
      </div>
    </div>
  );
}

function TimelineView({ logs }: { logs: any[] }) {
  return (
    <div className="p-5">
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-[#E2E8F0]" />
        <div className="space-y-5">
          {logs.map((log, i) => {
            const meta = getMeta(log.action);
            const Icon = meta.icon;
            return (
              <div key={log.id || i} className="flex items-start gap-4 pl-12 relative">
                <div className={`absolute left-2.5 w-6 h-6 rounded-full border flex items-center justify-center ${meta.color}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold text-[#0F172A]">{log.user?.name || 'System'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {log.description && <p className="text-sm text-[#64748B] mt-0.5">{log.description}</p>}
                      {log.user?.email && <p className="text-xs text-[#94A3B8] mt-0.5">{log.user.email}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#94A3B8] shrink-0 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span title={new Date(log.created_at).toLocaleString()}>{timeAgo(log.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TableView({ logs }: { logs: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[15px]">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            {['Time', 'User', 'Action', 'Description'].map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[#64748B] uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => {
            const meta = getMeta(log.action);
            return (
              <tr key={log.id || i} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                <td className="py-3 px-4 text-xs text-[#94A3B8] whitespace-nowrap">
                  <div>{new Date(log.created_at).toLocaleDateString()}</div>
                  <div>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-[#0F172A]">{log.user?.name || 'System'}</div>
                  {log.user?.email && <div className="text-xs text-[#94A3B8]">{log.user.email}</div>}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}>
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#64748B] max-w-xs truncate">{log.description || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
