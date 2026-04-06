"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Filter, RefreshCw, Clock, Search, List, GitBranch,
  LogIn, LogOut, Users, CheckSquare, FileText, MessageSquare,
  Settings, Key, Megaphone, Target, Download, ChevronDown,
  ArrowRight, Activity, Terminal, ShieldAlert, Cpu, Globe,
  Briefcase, Zap, UserCheck
} from 'lucide-react';
import { getTeamAuditLogs, getActionTypes } from '@/lib/audit-api';
import { cn } from '@/lib/utils';

const ACTION_META: Record<string, { color: string; icon: any }> = {
  LOGIN:               { color: 'bg-emerald-50 text-emerald-700 border-emerald-100',   icon: LogIn },
  LOGOUT:              { color: 'bg-slate-50 text-slate-600 border-slate-200',   icon: LogOut },
  REGISTER:            { color: 'bg-blue-50 text-blue-700 border-blue-100',      icon: UserCheck },
  TEAM_CREATED:        { color: 'bg-blue-50 text-blue-700 border-blue-100',      icon: Users },
  TEAM_UPDATED:        { color: 'bg-blue-50 text-blue-700 border-blue-100',      icon: Users },
  TEAM_ARCHIVED:       { color: 'bg-amber-50 text-amber-700 border-amber-100',   icon: ShieldAlert },
  TEAM_DELETED:        { color: 'bg-red-50 text-red-700 border-red-100',         icon: ShieldAlert },
  MEMBER_JOINED:       { color: 'bg-emerald-50 text-emerald-700 border-emerald-100',   icon: Users },
  MEMBER_LEFT:         { color: 'bg-amber-50 text-amber-700 border-amber-100',   icon: Users },
  MEMBER_REMOVED:      { color: 'bg-red-50 text-red-700 border-red-100',         icon: Users },
  MEMBER_INVITED:      { color: 'bg-cyan-50 text-cyan-700 border-cyan-100',      icon: Users },
  ROLE_UPDATED:        { color: 'bg-indigo-50 text-indigo-700 border-indigo-100',icon: Key },
  TASK_CREATED:        { color: 'bg-blue-50 text-blue-700 border-blue-100',      icon: CheckSquare },
  TASK_UPDATED:        { color: 'bg-blue-50 text-blue-700 border-blue-100',      icon: CheckSquare },
  TASK_DELETED:        { color: 'bg-red-50 text-red-700 border-red-100',         icon: CheckSquare },
  TASK_COMPLETED:      { color: 'bg-emerald-50 text-emerald-700 border-emerald-100',   icon: CheckSquare },
  FILE_UPLOADED:       { color: 'bg-indigo-50 text-indigo-700 border-indigo-100',icon: FileText },
  FILE_DELETED:        { color: 'bg-red-50 text-red-700 border-red-100',         icon: FileText },
  MESSAGE_SENT:        { color: 'bg-slate-50 text-slate-600 border-slate-200',   icon: MessageSquare },
  ANNOUNCEMENT_POSTED: { color: 'bg-amber-50 text-amber-700 border-amber-100',   icon: Megaphone },
  REPORT_GENERATED:    { color: 'bg-indigo-50 text-indigo-700 border-indigo-100',icon: FileText },
  SETTINGS_CHANGED:    { color: 'bg-slate-50 text-slate-600 border-slate-200',   icon: Settings },
  PASSWORD_CHANGED:    { color: 'bg-red-50 text-red-700 border-red-100',         icon: Key },
  PROFILE_UPDATED:     { color: 'bg-blue-50 text-blue-700 border-blue-100',      icon: Users },
  MILESTONE_CREATED:   { color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: Target },
  PROGRESS_UPDATED:    { color: 'bg-emerald-50 text-emerald-700 border-emerald-100',   icon: Activity },
};

function getMeta(action: string) {
  return ACTION_META[action] || { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: Activity };
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}M AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H AGO`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}D AGO`;
  return new Date(date).toLocaleDateString().toUpperCase();
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
  }, [router]);

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
      setActionTypes(Array.isArray(data) ? data.sort() : []);
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
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[3px] bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Security Audit Ledger</h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">immutable forensic activity record / sector synchronization</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {teams.length > 0 && (
            <div className="relative group">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-primary)]" />
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
                  className="bg-white border border-[var(--border)] rounded-[3px] pl-10 pr-10 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none appearance-none shadow-sm transition-all hover:bg-slate-50 cursor-pointer">
                  {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 pointer-events-none transition-transform group-hover:translate-y-0.5" />
            </div>
          )}
          <button onClick={() => setShowFilters(f => !f)}
            className={cn(
                "flex items-center gap-3 h-12 px-6 border rounded-[3px] text-[10px] font-bold uppercase tracking-widest transition-all",
                showFilters ? "border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]" : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-blue-300 shadow-sm"
            )}>
            <Filter className="h-4 w-4" />
            HEURISTIC FILTERS {activeFilterCount > 0 && <span className="bg-[var(--color-primary)] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center ml-2">{activeFilterCount}</span>}
          </button>
          <button onClick={loadLogs} className="h-12 w-12 flex items-center justify-center border border-[var(--border)] bg-white rounded-[3px] text-slate-400 hover:text-[var(--color-primary)] hover:border-blue-300 transition-all shadow-sm">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button onClick={exportCSV} className="jira-button border border-[var(--border)] bg-white text-[var(--text-muted)] h-12 px-6 gap-3 font-bold uppercase text-[10px] hover:border-blue-300 hover:text-[var(--color-primary)] shadow-sm">
            <Download className="h-4 w-4" /> Export Ledger
          </button>
        </div>
      </div>

      {/* Modern Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[var(--color-primary)] transition-colors" />
        <input
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && loadLogs()}
          placeholder="SEARCH FORENSIC RECORDS, USER SIGNATURES, OR SYSTEM EVENTS..."
          className="w-full pl-12 pr-6 py-4 bg-white border border-[var(--border)] rounded-[3px] text-[11px] font-bold uppercase tracking-[0.2em] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-300 uppercase tracking-widest pointer-events-none group-focus-within:opacity-0 transition-opacity">
            Press Enter to Query
        </div>
      </div>

      {/* Extended Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-[3px] border border-[var(--border)] p-8 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Target Personnel</label>
              <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <select value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
                    className="w-full bg-slate-50 border border-[var(--border)] rounded-[3px] pl-10 pr-3 py-2.5 text-[11px] font-bold uppercase tracking-tight outline-none focus:border-[var(--color-primary)] appearance-none">
                    <option value="">ALL SECURITY GROUPS</option>
                    {members.map((m: any) => <option key={m.user_id} value={m.user_id}>{m.user?.name || m.user_id}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Action Heuristic</label>
              <div className="relative">
                  <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
                    className="w-full bg-slate-50 border border-[var(--border)] rounded-[3px] pl-10 pr-3 py-2.5 text-[11px] font-bold uppercase tracking-tight outline-none focus:border-[var(--color-primary)] appearance-none">
                    <option value="">ALL PROTOCOLS</option>
                    {actionTypes.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Temporal From</label>
              <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                    className="w-full bg-slate-50 border border-[var(--border)] rounded-[3px] pl-10 pr-3 py-2.5 text-[11px] font-bold uppercase tracking-tight outline-none focus:border-[var(--color-primary)]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Temporal To</label>
              <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))}
                    className="w-full bg-slate-50 border border-[var(--border)] rounded-[3px] pl-10 pr-3 py-2.5 text-[11px] font-bold uppercase tracking-tight outline-none focus:border-[var(--color-primary)]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest pl-1">Sorting Logic</label>
              <div className="relative">
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                    className="w-full bg-slate-50 border border-[var(--border)] rounded-[3px] pl-10 pr-3 py-2.5 text-[11px] font-bold uppercase tracking-tight outline-none focus:border-[var(--color-primary)] appearance-none">
                    <option value="desc">NEWEST TRANSMISSION</option>
                    <option value="asc">ARCHIVED FIRST</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
            <button onClick={loadLogs}
              className="jira-button jira-button-primary h-11 px-8 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
              Query Ledger
            </button>
            <button onClick={() => { setFilters({ userId: '', action: '', from: '', to: '', search: '', sort: 'desc' }); }}
              className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-11 px-8 font-bold uppercase text-[10px] hover:bg-slate-50">
              Reset Parameters
            </button>
          </div>
        </div>
      )}

      {/* View Toggle + Statistics */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                 Sector Live Stream: {logs.length} Data Points Analyzed
             </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-[4px] border border-slate-200 shadow-inner">
          <button onClick={() => setView('timeline')}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-[3px] text-[10px] font-extrabold uppercase tracking-widest transition-all",
                view === 'timeline' ? "bg-white text-[var(--color-primary)] shadow-md" : "text-slate-400 hover:text-slate-600"
            )}>
            <GitBranch className="h-3.5 w-3.5" /> Timeline
          </button>
          <button onClick={() => setView('table')}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-[3px] text-[10px] font-extrabold uppercase tracking-widest transition-all",
                view === 'table' ? "bg-white text-[var(--color-primary)] shadow-md" : "text-slate-400 hover:text-slate-600"
            )}>
            <List className="h-3.5 w-3.5" /> Data Grid
          </button>
        </div>
      </div>

      {/* Core Ledger Content */}
      <div className="bg-white rounded-[3px] border border-[var(--border)] shadow-sm overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-4 opacity-40">
            <div className="h-8 w-8 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin" />
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Executing Ledger Query...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-48 flex flex-col items-center opacity-30">
            <ShieldAlert className="h-16 w-16 text-[var(--text-muted)] mb-6 stroke-[1px]" />
            <p className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Zero Trace Detected</p>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">No matching activities found within current filter scope.</p>
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
    <div className="p-10">
      <div className="relative">
        <div className="absolute left-4.5 top-2 bottom-2 w-0.5 bg-slate-100" style={{ left: '19px' }} />
        <div className="space-y-12">
          {logs.map((log, i) => {
            const meta = getMeta(log.action);
            const Icon = meta.icon;
            return (
              <div key={log.id || i} className="flex items-start gap-10 pl-16 relative group">
                {/* Timeline Marker */}
                <div className={cn(
                    "absolute left-0 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                    meta.color
                )} style={{ left: '0px' }}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    <div className="lg:col-span-3">
                         <div className="flex items-center gap-3 mb-2">
                             <span className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-tight">{log.user?.name || 'SYSTEM_DAEMON'}</span>
                             <span className={cn("px-2 py-0.5 rounded-[2px] text-[8px] font-extrabold border uppercase tracking-widest shadow-sm", meta.color)}>
                               {log.action?.replace(/_/g, ' ')}
                             </span>
                         </div>
                         <div className="bg-slate-50/50 border border-slate-100 border-dashed rounded-[3px] p-4 group-hover:bg-white group-hover:border-[var(--color-primary)] transition-all">
                              <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed italic">{log.description || 'System state modification recorded without comment.'}</p>
                         </div>
                         {log.user?.email && (
                             <div className="mt-3 flex items-center gap-2">
                                 <Terminal className="h-3 w-3 text-slate-300" />
                                 <span className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter">{log.user.email}</span>
                             </div>
                         )}
                    </div>
                    {/* Timestamp Section */}
                    <div className="lg:col-span-1 flex flex-col lg:items-end justify-start">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest mb-1 bg-blue-50/50 px-2 py-1 border border-blue-100 rounded-[2px]">
                          <Clock className="h-3 w-3" />
                          <span title={new Date(log.created_at).toLocaleString()}>{timeAgo(log.created_at)}</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter text-right">
                            {new Date(log.created_at).toLocaleDateString()} // {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
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
    <div className="overflow-x-auto no-scrollbar">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
            {['Temporal Timestamp', 'Security Entity', 'Protocol Action', 'Forensic Brief'].map(h => (
              <th key={h} className="text-left px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {logs.map((log, i) => {
            const meta = getMeta(log.action);
            return (
              <tr key={log.id || i} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                      <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tighter">{new Date(log.created_at).toLocaleDateString()}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {log.user?.name?.[0] || 'S'}
                      </div>
                      <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{log.user?.name || 'SYSTEM_DAEMON'}</span>
                          {log.user?.email && <span className="text-[10px] font-mono font-bold text-slate-300 tracking-tighter italic">{log.user.email}</span>}
                      </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={cn("px-3 py-1 rounded-[2px] text-[9px] font-bold border uppercase tracking-widest shadow-sm", meta.color)}>
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-8 py-5">
                    <div className="flex items-center gap-3 max-w-lg">
                        <ArrowRight className="h-3 w-3 text-slate-200 group-hover:text-[var(--color-primary)] transition-all" />
                        <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed italic truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all duration-300">{log.description || 'Log metadata unavailable.'}</p>
                    </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
