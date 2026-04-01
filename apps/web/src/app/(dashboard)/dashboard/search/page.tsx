"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, CheckSquare, FileText, MessageSquare, Megaphone,
  Target, Users, Briefcase, X, Filter, SlidersHorizontal,
  Clock, ArrowUpDown, Shield
} from 'lucide-react';
import { globalSearch } from '@/lib/search-api';

const TYPES = [
  { value: '', label: 'All' },
  { value: 'task', label: 'Tasks', icon: CheckSquare },
  { value: 'file', label: 'Files', icon: FileText },
  { value: 'message', label: 'Messages', icon: MessageSquare },
  { value: 'announcement', label: 'Announcements', icon: Megaphone },
  { value: 'milestone', label: 'Milestones', icon: Target },
  { value: 'member', label: 'Members', icon: Users },
  { value: 'team', label: 'Teams', icon: Briefcase },
  { value: 'report', label: 'Reports', icon: FileText },
  { value: 'log', label: 'Activity', icon: Shield },
];

const TYPE_ICONS: Record<string, any> = {
  task: CheckSquare, file: FileText, message: MessageSquare,
  announcement: Megaphone, milestone: Target, member: Users,
  team: Briefcase, report: FileText, log: Shield,
};

const TYPE_COLORS: Record<string, string> = {
  task: 'bg-blue-50 text-blue-600',
  file: 'bg-purple-50 text-purple-600',
  message: 'bg-green-50 text-green-600',
  announcement: 'bg-amber-50 text-amber-600',
  milestone: 'bg-emerald-50 text-emerald-600',
  member: 'bg-pink-50 text-pink-600',
  team: 'bg-slate-50 text-slate-600',
  report: 'bg-indigo-50 text-indigo-600',
  log: 'bg-red-50 text-red-600',
};

const STATUS_OPTIONS = ['', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
const PRIORITY_OPTIONS = ['', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'alpha', label: 'Alphabetical' },
  { value: 'deadline', label: 'By deadline' },
  { value: 'priority', label: 'By priority' },
];

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [activeType, setActiveType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    teamId: '', status: '', priority: '', from: '', to: '', sort: 'newest',
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    inputRef.current?.focus();
    loadTeams();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults(null); setTotal(0); return; }
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, activeType, filters]);

  async function loadTeams() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function doSearch(q: string) {
    setLoading(true);
    try {
      const data = await globalSearch(q, {
        type: activeType || undefined,
        teamId: filters.teamId || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        sort: filters.sort,
        limit: 15,
      });
      setResults(data.results);
      setTotal(data.total || 0);
    } catch { setResults(null); }
    finally { setLoading(false); }
  }

  const allItems = results ? Object.values(results).flat() as any[] : [];
  const filteredItems = activeType ? allItems.filter((i: any) => i.type === activeType) : allItems;

  const groupedSections = results ? TYPES.slice(1).map(t => ({
    ...t,
    items: (results[`${t.value}s`] || results[t.value] || []),
  })).filter(s => s.items.length > 0) : [];

  const activeFilterCount = [filters.teamId, filters.status, filters.priority, filters.from, filters.to]
    .filter(Boolean).length;

  return (
    <div className="space-y-5 ">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Search</h1>
        <p className="text-[15px] text-[#64748B] mt-0.5">Search across tasks, files, messages, members, and more</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search anything..."
            className="w-full pl-12 pr-10 py-3 border border-[#E2E8F0] rounded-xl text-[15px] text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] shadow-sm"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults(null); }} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-[#94A3B8] hover:text-[#64748B]" />
            </button>
          )}
        </div>
        <button onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-3 border rounded-xl text-[15px] font-medium transition-colors ${showFilters ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters {activeFilterCount > 0 && <span className="bg-[#1D4ED8] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Team</label>
              <select value={filters.teamId} onChange={e => setFilters(f => ({ ...f, teamId: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                <option value="">All teams</option>
                {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Status</label>
              <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'Any status'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Priority</label>
              <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p || 'Any priority'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">From</label>
              <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Sort by</label>
              <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => setFilters({ teamId: '', status: '', priority: '', from: '', to: '', sort: 'newest' })}
            className="mt-3 text-xs text-[#1D4ED8] hover:underline">Clear filters</button>
        </div>
      )}

      {/* Type tabs */}
      {query.length >= 2 && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setActiveType(t.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[15px] font-medium whitespace-nowrap transition-colors ${activeType === t.value ? 'bg-[#1D4ED8] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}>
              {t.icon && <t.icon className="h-3.5 w-3.5" />}
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-[#64748B]">
          <div className="h-4 w-4 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
          <span className="text-[15px]">Searching...</span>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <>
          <p className="text-[15px] text-[#64748B]">
            {total > 0 ? `${total} result${total !== 1 ? 's' : ''} for "${query}"` : `No results for "${query}"`}
          </p>

          {groupedSections.length === 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
              <Search className="h-10 w-10 text-[#94A3B8] mx-auto mb-3" />
              <p className="text-[15px] font-medium text-[#0F172A]">Nothing found</p>
              <p className="text-sm text-[#64748B] mt-1">Try a different search term or adjust filters</p>
            </div>
          )}

          {groupedSections.map(section => (
            <div key={section.value} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F1F5F9] flex items-center gap-2">
                {section.icon && <section.icon className="h-4 w-4 text-[#64748B]" />}
                <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{section.label}</h2>
                <span className="ml-auto text-xs text-[#94A3B8]">{section.items.length} result{section.items.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {section.items.map((item: any) => {
                  const Icon = TYPE_ICONS[item.type] || FileText;
                  const colorClass = TYPE_COLORS[item.type] || 'bg-slate-50 text-slate-600';
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-[#0F172A] truncate">
                          {item.title || item.name || item.body?.slice(0, 80) || item.original_name || item.action || 'â€”'}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {item.status && <StatusBadge status={item.status} />}
                          {item.priority && <PriorityBadge priority={item.priority} />}
                          {item.role && <span className="text-xs text-[#94A3B8]">{item.role}</span>}
                          {item.email && <span className="text-xs text-[#94A3B8]">{item.email}</span>}
                          {item.report_type && <span className="text-xs text-[#94A3B8]">{item.report_type}</span>}
                          {item.sender?.name && <span className="text-xs text-[#94A3B8]">by {item.sender.name}</span>}
                          {item.user?.name && <span className="text-xs text-[#94A3B8]">by {item.user.name}</span>}
                          {item.created_at && (
                            <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          )}
                          {item.due_date && (
                            <span className="text-xs text-[#94A3B8]">
                              Due {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Empty state */}
      {!loading && !results && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-16 text-center">
          <Search className="h-12 w-12 text-[#94A3B8] mx-auto mb-4" />
          <p className="text-[15px] font-medium text-[#0F172A]">Start typing to search</p>
          <p className="text-sm text-[#64748B] mt-1">Search tasks, files, messages, members, reports, and more</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {['tasks', 'files', 'messages', 'members', 'milestones'].map(hint => (
              <button key={hint} onClick={() => setQuery(hint)}
                className="px-3 py-1 bg-[#F1F5F9] rounded-full text-xs text-[#64748B] hover:bg-[#E2E8F0] transition-colors">
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    TODO: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    REVIEW: 'bg-amber-50 text-amber-700',
    COMPLETED: 'bg-green-50 text-green-700',
    NOT_STARTED: 'bg-slate-100 text-slate-600',
    ONGOING: 'bg-blue-50 text-blue-700',
  };
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-blue-50 text-blue-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-700',
  };
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${map[priority] || 'bg-slate-100 text-slate-600'}`}>{priority}</span>;
}
