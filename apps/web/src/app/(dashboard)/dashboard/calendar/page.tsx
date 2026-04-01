"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, X, Calendar } from 'lucide-react';
import { getTeamEvents, createEvent, deleteEvent } from '@/lib/calendar-api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EVENT_COLORS: Record<string, string> = {
  EVENT: '#3B82F6',
  DEADLINE: '#EF4444',
  MEETING: '#8B5CF6',
  REMINDER: '#F59E0B',
  MILESTONE: '#10B981',
};

export default function CalendarPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('MEMBER');
  const [form, setForm] = useState({ title: '', type: 'EVENT', start_date: '', end_date: '', description: '', all_day: true });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) loadEvents();
  }, [selectedTeam, currentDate]);

  async function loadTeams() {
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
  }

  async function loadEvents() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    try {
      const data = await getTeamEvents(selectedTeam, from, to);
      setEvents(Array.isArray(data) ? data : []);
    } catch { setEvents([]); }
  }

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Calendar</h1>
          <p className="text-[15px] text-[#64748B] mt-0.5">Deadlines, meetings, and team events</p>
        </div>
        <div className="flex items-center gap-3">
          {teams.length > 0 && (
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          {(userRole === 'LEADER' || userRole === 'REVIEWER') && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] text-white rounded-lg text-[15px] font-medium hover:bg-[#1e40af] transition-colors">
              <Plus className="h-4 w-4" /> Add Event
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-[#64748B] capitalize">{type.toLowerCase()}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-5">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
              <ChevronLeft className="h-5 w-5 text-[#64748B]" />
            </button>
            <h2 className="text-[15px] font-semibold text-[#0F172A]">{MONTHS[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors">
              <ChevronRight className="h-5 w-5 text-[#64748B]" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-[#94A3B8] py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-[#E2E8F0] rounded-lg overflow-hidden">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="bg-[#F8FAFC] h-20" />;
              const dayEvents = getEventsForDay(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDay?.toDateString() === date.toDateString();
              return (
                <div key={i} onClick={() => setSelectedDay(date)}
                  className={`bg-white h-20 p-1.5 cursor-pointer hover:bg-[#F8FAFC] transition-colors ${isSelected ? 'ring-2 ring-inset ring-[#1D4ED8]' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${isToday ? 'bg-[#1D4ED8] text-white' : 'text-[#0F172A]'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e, ei) => (
                      <div key={ei} className="text-[10px] truncate rounded px-1 text-white"
                        style={{ backgroundColor: e.color || EVENT_COLORS[e.type] || '#3B82F6' }}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[10px] text-[#94A3B8]">+{dayEvents.length - 2} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          {selectedDay ? (
            <>
              <h2 className="text-[15px] font-semibold text-[#0F172A] mb-3">
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-[#94A3B8] text-center py-8">No events this day</p>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-[#E2E8F0]">
                      <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: e.color || EVENT_COLORS[e.type] || '#3B82F6' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-medium text-[#0F172A]">{e.title}</p>
                        <p className="text-xs text-[#64748B] capitalize">{e.type?.toLowerCase()}</p>
                        {e.description && <p className="text-xs text-[#94A3B8] mt-1">{e.description}</p>}
                      </div>
                      {e.source === 'manual' && (userRole === 'LEADER') && (
                        <button onClick={() => handleDelete(e.id)} className="text-[#94A3B8] hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Calendar className="h-8 w-8 text-[#94A3B8] mb-2" />
              <p className="text-sm text-[#94A3B8]">Click a day to see events</p>
            </div>
          )}
        </div>
      </div>

      {/* Create event modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-[#0F172A]">New Event</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-[#64748B]" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                  {Object.keys(EVENT_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Date</label>
                <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Description (optional)</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate}
                className="flex-1 py-2 bg-[#1D4ED8] text-white rounded-lg text-[15px] font-medium hover:bg-[#1e40af] transition-colors">
                Create Event
              </button>
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg text-[15px] hover:bg-[#F8FAFC] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
