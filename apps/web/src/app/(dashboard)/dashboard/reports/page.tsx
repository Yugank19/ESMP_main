"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Plus, Filter, ChevronDown, ChevronRight, Users, CheckSquare, Clock, Target } from 'lucide-react';
import { generateReport, getTeamReports, getReport } from '@/lib/reports-api';

const REPORT_TYPES = [
  { value: 'TASK', label: 'Task Report', icon: CheckSquare },
  { value: 'TEAM_PROGRESS', label: 'Team Progress', icon: TrendingUp },
  { value: 'MEMBER_PERFORMANCE', label: 'Member Performance', icon: Users },
  { value: 'DEADLINE', label: 'Deadline Report', icon: Clock },
  { value: 'MILESTONE', label: 'Milestone Report', icon: Target },
  { value: 'FILE_ACTIVITY', label: 'File Activity', icon: FileText },
];

import { TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ report_type: 'TASK', title: '', filters: { status: '', priority: '', from: '', to: '' } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) loadReports(selectedTeam);
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
    } finally {
      setLoading(false);
    }
  }

  async function loadReports(teamId: string) {
    try {
      const data = await getTeamReports(teamId);
      setReports(Array.isArray(data) ? data : []);
    } catch { setReports([]); }
  }

  async function handleGenerate() {
    if (!selectedTeam) return;
    setGenerating(true);
    try {
      const dto = {
        report_type: form.report_type,
        title: form.title || `${form.report_type} Report`,
        filters: Object.fromEntries(Object.entries(form.filters).filter(([, v]) => v)),
      };
      const report = await generateReport(selectedTeam, dto);
      setReports(prev => [report, ...prev]);
      setSelectedReport(report);
      setShowForm(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function viewReport(reportId: string) {
    try {
      const data = await getReport(reportId);
      setSelectedReport(data);
    } catch (e: any) {
      alert(e.message);
    }
  }

  function exportCSV(report: any) {
    if (!report?.data) return;
    const data = report.data;
    let csv = '';

    if (data.tasks) {
      csv = 'Title,Status,Priority,Due Date\n';
      data.tasks.forEach((t: any) => {
        csv += `"${t.title}","${t.status}","${t.priority}","${t.due_date || ''}"\n`;
      });
    } else if (data.members) {
      csv = 'Name,Role,Assigned,Completed,Overdue,Rate\n';
      data.members.forEach((m: any) => {
        csv += `"${m.user.name}","${m.role}","${m.assigned}","${m.completed}","${m.overdue}","${m.completionRate}%"\n`;
      });
    }

    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF(report: any) {
    window.print();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Reports</h1>
          <p className="text-[15px] text-[#64748B] mt-0.5">Generate and view team reports</p>
        </div>
        <div className="flex items-center gap-3">
          {teams.length > 0 && (
            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] text-white rounded-lg text-[15px] font-medium hover:bg-[#1e40af] transition-colors">
            <Plus className="h-4 w-4" /> Generate Report
          </button>
        </div>
      </div>

      {/* Generate form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <h2 className="text-[15px] font-semibold text-[#0F172A] mb-4">New Report</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Report Type</label>
              <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">Title (optional)</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Auto-generated if empty"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">From Date</label>
              <input type="date" value={form.filters.from} onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, from: e.target.value } }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748B] mb-1">To Date</label>
              <input type="date" value={form.filters.to} onChange={e => setForm(f => ({ ...f, filters: { ...f.filters, to: e.target.value } }))}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleGenerate} disabled={generating}
              className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg text-[15px] font-medium hover:bg-[#1e40af] disabled:opacity-50 transition-colors">
              {generating ? 'Generating...' : 'Generate'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg text-[15px] hover:bg-[#F8FAFC] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Report list */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
          <h2 className="text-[15px] font-semibold text-[#0F172A] mb-3">Generated Reports</h2>
          {reports.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-8">No reports yet</p>
          ) : (
            <div className="space-y-2">
              {reports.map(r => (
                <button key={r.id} onClick={() => viewReport(r.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedReport?.id === r.id ? 'border-[#1D4ED8] bg-blue-50' : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'}`}>
                  <p className="text-[15px] font-medium text-[#0F172A] truncate">{r.title}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{r.report_type} Â· {new Date(r.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Report viewer */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] p-5">
          {!selectedReport ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-10 w-10 text-[#94A3B8] mb-3" />
              <p className="text-[15px] font-medium text-[#0F172A]">Select a report to view</p>
              <p className="text-sm text-[#64748B] mt-1">Or generate a new one</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#0F172A]">{selectedReport.title}</h2>
                  <p className="text-xs text-[#64748B]">{selectedReport.report_type} Â· {new Date(selectedReport.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => exportCSV(selectedReport)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC]">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </button>
                  <button onClick={() => exportPDF(selectedReport)}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC]">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                </div>
              </div>
              <ReportViewer report={selectedReport} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportViewer({ report }: { report: any }) {
  const data = report.data;
  if (!data) return <p className="text-sm text-[#94A3B8]">No data available</p>;

  if (data.summary && data.tasks) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(data.summary).map(([k, v]) => (
            <div key={k} className="bg-[#F8FAFC] rounded-lg p-3">
              <p className="text-xl font-bold text-[#0F172A]">{String(v)}</p>
              <p className="text-xs text-[#64748B] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
            </div>
          ))}
        </div>
        <TaskTable tasks={data.tasks} />
      </div>
    );
  }

  if (data.members) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              {['Member', 'Role', 'Assigned', 'Completed', 'Overdue', 'Rate'].map(h => (
                <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-[#64748B] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.members.map((m: any) => (
              <tr key={m.user.id} className="border-b border-[#F1F5F9]">
                <td className="py-2 px-3 font-medium text-[#0F172A]">{m.user.name}</td>
                <td className="py-2 px-3 text-[#64748B]">{m.role}</td>
                <td className="py-2 px-3">{m.assigned}</td>
                <td className="py-2 px-3 text-emerald-600">{m.completed}</td>
                <td className="py-2 px-3 text-red-500">{m.overdue}</td>
                <td className="py-2 px-3 font-medium">{m.completionRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.milestones) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          {[['Total', data.total], ['Completed', data.completed], ['Ongoing', data.ongoing], ['Not Started', data.notStarted]].map(([k, v]) => (
            <div key={String(k)} className="bg-[#F8FAFC] rounded-lg p-3">
              <p className="text-xl font-bold text-[#0F172A]">{String(v)}</p>
              <p className="text-xs text-[#64748B]">{String(k)}</p>
            </div>
          ))}
        </div>
        {data.milestones.map((m: any) => (
          <div key={m.id} className="border border-[#E2E8F0] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-[#0F172A]">{m.name}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs ${m.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : m.status === 'ONGOING' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'}`}>{m.status}</span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">{m.tasks?.length ?? 0} tasks linked</p>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="text-xs text-[#64748B] overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>;
}

function TaskTable({ tasks }: { tasks: any[] }) {
  if (!tasks?.length) return <p className="text-sm text-[#94A3B8]">No tasks</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[15px]">
        <thead>
          <tr className="border-b border-[#E2E8F0]">
            {['Title', 'Status', 'Priority', 'Due Date'].map(h => (
              <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-[#64748B] uppercase">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t: any) => (
            <tr key={t.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
              <td className="py-2 px-3 font-medium text-[#0F172A]">{t.title}</td>
              <td className="py-2 px-3"><StatusBadge status={t.status} /></td>
              <td className="py-2 px-3"><PriorityBadge priority={t.priority} /></td>
              <td className="py-2 px-3 text-[#64748B]">{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'â€”'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    TODO: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    REVIEW: 'bg-amber-50 text-amber-700',
    COMPLETED: 'bg-green-50 text-green-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-blue-50 text-blue-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-700',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[priority] || 'bg-slate-100 text-slate-600'}`}>{priority}</span>;
}
