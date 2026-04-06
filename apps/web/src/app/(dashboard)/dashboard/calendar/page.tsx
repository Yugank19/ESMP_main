"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, 
    Clock, MapPin, Users, Info, Bell, Target, Flag, 
    AlertCircle, Briefcase, Zap, Search, Layout
} from 'lucide-react';
import { getTeamEvents, createEvent, deleteEvent } from '@/lib/calendar-api';
import { cn } from '@/lib/utils';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const EVENT_META: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  EVENT: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100', icon: CalendarIcon },
  DEADLINE: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100', icon: AlertCircle },
  MEETING: { color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: Users },
  REMINDER: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100', icon: Bell },
  MILESTONE: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Flag },
};

const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase tracking-tight";
const labelClass = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 block pl-1";

export default function CalendarPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('MEMBER');
  const [form, setForm] = useState({ title: '', type: 'EVENT', start_date: '', end_date: '', description: '', all_day: true });

  const loadEvents = useCallback(async () => {
    if (!selectedTeam) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    try {
      const data = await getTeamEvents(selectedTeam, from, to);
      setEvents(Array.isArray(data) ? data : []);
    } catch { setEvents([]); }
  }, [selectedTeam, currentDate]);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTeams(list);
      if (list.length > 0) {
        setSelectedTeam(list[0].id);
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          const membership = list[0].members?.find((m: any) => m.user_id === u.id);
          if (membership) setUserRole(membership.role);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    loadTeams();
  }, [loadTeams, router]);

  useEffect(() => {
    if (selectedTeam) loadEvents();
  }, [loadEvents]);

  async function handleCreate() {
    if (!form.title || !form.start_date) return;
    try {
      await createEvent(selectedTeam, form);
      setShowCreate(false);
      setForm({ title: '', type: 'EVENT', start_date: '', end_date: '', description: '', all_day: true });
      loadEvents();
    } catch (e: any) { alert(e.message); }
  }

  async function handleDelete(eventId: string) {
    if (!eventId.startsWith('task-') && !eventId.startsWith('milestone-')) {
      if (!confirm('Abort this event protocol?')) return;
      try {
        await deleteEvent(eventId);
        loadEvents();
      } catch (e: any) { alert(e.message); }
    }
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  function getEventsForDay(date: Date) {
    return events.filter(e => {
      const ed = new Date(e.start_date);
      return ed.getFullYear() === date.getFullYear() && ed.getMonth() === date.getMonth() && ed.getDate() === date.getDate();
    });
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[3px] bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Temporal Operations Interface</h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Chronological mission scheduling and event synchronization</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {teams.length > 0 && (
            <div className="relative group">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-primary)]" />
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
                  className="bg-white border border-[var(--border)] rounded-[3px] pl-10 pr-10 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none appearance-none shadow-sm transition-all hover:bg-slate-50 cursor-pointer">
                  {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none rotate-90" />
            </div>
          )}
          {(userRole === 'LEADER' || userRole === 'REVIEWER') && (
            <button onClick={() => setShowCreate(true)}
              className="jira-button jira-button-primary h-12 px-8 gap-3 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
              <Plus className="h-4 w-4" /> Add Protocol
            </button>
          )}
        </div>
      </div>

      {/* Heuristic Legend */}
      <div className="flex flex-wrap gap-4 px-2">
        {Object.entries(EVENT_META).map(([type, meta]) => (
          <div key={type} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-[2px] border shadow-sm", meta.bg, meta.border)}>
            <meta.icon className={cn("h-3 w-3", meta.color)} />
            <span className={cn("text-[9px] font-extrabold uppercase tracking-widest", meta.color)}>{type}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Main Grid Container */}
        <div className="lg:col-span-3 card p-0 overflow-hidden shadow-md">
          {/* Internal Month Navigation */}
          <div className="bg-[var(--bg-surface-2)] border-b border-[var(--border)] px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
                 <div className="flex items-center bg-white border border-[var(--border)] rounded-[3px] shadow-sm p-1">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                      className="p-2 rounded-[2px] hover:bg-slate-50 text-slate-400 hover:text-[var(--color-primary)] transition-all">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-100 mx-1" />
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                      className="p-2 rounded-[2px] hover:bg-slate-50 text-slate-400 hover:text-[var(--color-primary)] transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                 </div>
                 <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">{MONTHS[month]} <span className="font-light text-slate-300">{year}</span></h2>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="btn-secondary h-10 px-6 text-[10px] font-bold uppercase tracking-widest border border-[var(--border)] bg-white rounded-[3px] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">Jump to Core</button>
          </div>

          {/* Grid Headers */}
          <div className="grid grid-cols-7 border-b border-[var(--border)] bg-slate-50">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[9px] font-black text-slate-400 py-3 uppercase tracking-[0.2em]">{d}</div>
            ))}
          </div>

          {/* Grid Core */}
          <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="bg-slate-50/50 h-32" />;
              const dayEvents = getEventsForDay(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDay?.toDateString() === date.toDateString();
              const isCurrentMonth = date.getMonth() === month;
              
              return (
                <div key={i} onClick={() => setSelectedDay(date)}
                  className={cn(
                      "bg-white h-32 p-3 cursor-pointer transition-all relative flex flex-col group",
                      !isCurrentMonth && "opacity-40",
                      isSelected ? "ring-2 ring-inset ring-[var(--color-primary)] bg-blue-50/20 z-10" : "hover:bg-slate-50 hover:z-10"
                  )}>
                  <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 transition-all",
                      isToday ? "bg-[var(--color-primary)] text-white shadow-lg scale-110" : "text-[var(--text-primary)] group-hover:bg-slate-200"
                  )}>
                    {date.getDate()}
                  </div>
                  
                  <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                    {dayEvents.slice(0, 3).map((e, ei) => {
                      const meta = EVENT_META[e.type] || EVENT_META.EVENT;
                      return (
                        <div key={ei} className={cn(
                            "text-[9px] font-bold truncate rounded-[2px] px-2 py-1 border shadow-xs transition-transform hover:translate-x-0.5",
                            meta.bg, meta.color, meta.border
                        )}>
                          {e.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                        <div className="text-[8px] font-extrabold text-slate-300 uppercase tracking-widest pl-1">
                            + {dayEvents.length - 3} PROTOCOLS
                        </div>
                    )}
                  </div>

                  {isSelected && (
                      <div className="absolute right-2 top-2">
                          <Zap className="h-3 w-3 text-[var(--color-primary)] fill-[var(--color-primary)]" />
                      </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Detail Panel */}
        <div className="lg:col-span-1 space-y-6">
            <div className="card p-6 border-l-4 border-l-[var(--color-primary)] shadow-lg animate-in slide-in-from-right-4 duration-500">
                {selectedDay ? (
                    <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-[0.3em] mb-1">Operational Agenda</p>
                            <h2 className="text-lg font-bold text-[var(--text-primary)] uppercase leading-tight">
                                {selectedDay.toLocaleDateString('en-US', { weekday: 'long' })} / {selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </h2>
                        </div>

                        {selectedDayEvents.length === 0 ? (
                            <div className="py-12 px-4 bg-slate-50 border border-dashed border-[var(--border)] rounded-[3px] text-center opacity-30">
                                <Info className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4 stroke-[1px]" />
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Temporal Clear</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {selectedDayEvents.map((e, i) => {
                                    const meta = EVENT_META[e.type] || EVENT_META.EVENT;
                                    return (
                                        <div key={i} className="group relative bg-white border border-[var(--border)] rounded-[3px] p-4 hover:border-[var(--color-primary)] transition-all shadow-sm hover:shadow-md">
                                            <div className="flex items-start gap-4">
                                                <div className={cn("w-10 h-10 rounded-[3px] flex items-center justify-center border shadow-inner", meta.bg, meta.border)}>
                                                    <meta.icon className={cn("h-4 w-4", meta.color)} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-[var(--text-primary)] leading-tight mb-1 group-hover:text-[var(--color-primary)] transition-colors">{e.title}</p>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={cn("text-[8px] font-extrabold uppercase tracking-widest", meta.color)}>{e.type}</span>
                                                        <span className="text-slate-200">·</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">SYNCHRONIZED</span>
                                                    </div>
                                                </div>
                                                {e.source === 'manual' && (userRole === 'LEADER') && (
                                                    <button onClick={() => handleDelete(e.id)} className="p-1 px-1.5 rounded-[2px] text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            {e.description && (
                                                <p className="mt-3 text-[11px] font-medium text-[var(--text-secondary)] border-l-2 border-slate-100 pl-3 leading-relaxed italic opacity-80 group-hover:opacity-100">
                                                    {e.description}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {(userRole === 'LEADER' || userRole === 'REVIEWER') && (
                            <button onClick={() => setShowCreate(true)}
                                className="w-full flex items-center justify-center gap-3 h-12 border border-[var(--color-primary)] text-[var(--color-primary)] bg-white rounded-[3px] text-[10px] font-bold uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm group">
                                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" /> Initialize New Protocol
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center opacity-30">
                        <CalendarIcon className="h-12 w-12 text-[var(--text-muted)] mb-4 stroke-[1px]" />
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-relaxed">Select temporal point to view active mission protocols</p>
                    </div>
                )}
            </div>

            {/* Sub-Panel: Intelligence Overview */}
            <div className="card p-6 border-[var(--border)] bg-slate-50 shadow-sm opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Heuristic Overview</h4>
                 <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                           <span>MONTHLY_TOTAL</span>
                           <span className="text-[var(--text-primary)]">{events.length}</span>
                      </div>
                      <div className="h-px bg-slate-200" />
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                           <span>PENDING_DEADLINES</span>
                           <span className="text-red-500">{events.filter(e => e.type === 'DEADLINE').length}</span>
                      </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Creation Protocol Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col transition-all">
            <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[var(--color-primary)]" />
                  <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">New Temporal Entry</h2>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-[3px] hover:bg-white hover:border-[var(--border)] border border-transparent transition-all">
                  <X className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div>
                 <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight uppercase">Protocol Initialization</h3>
                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1 italic">Assigning resources to temporal coordinates</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelClass}>Protocol Title</label>
                  <input required value={form.title} placeholder="MISSION_IDENTIFIER" onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className={cn(inputClass, "uppercase")} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Operational Type</label>
                      <div className="relative">
                          <Layout className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                            className={cn(inputClass, "pl-10 appearance-none bg-slate-50")}>
                            {Object.keys(EVENT_META).map(t => <option key={t} value={t}>{t}_LOG</option>)}
                          </select>
                          <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 rotate-90" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Target Date</label>
                      <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                          <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                            className={cn(inputClass, "pl-10")} />
                      </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Technical brief (optional)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
                    placeholder="Provide mission-critical description and logistic details..."
                    className={cn(inputClass, "resize-none font-medium normal-case leading-relaxed")} />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-50">
                <button onClick={handleCreate}
                  className="jira-button jira-button-primary h-12 flex-1 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
                  Commit Protocol
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="jira-button border border-[var(--border)] h-12 flex-1 font-bold uppercase text-[10px] bg-white text-[var(--text-muted)]">
                  Abort
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
