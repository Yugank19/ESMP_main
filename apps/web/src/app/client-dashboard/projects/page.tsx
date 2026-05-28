"use client";
import { useEffect, useState } from "react";
import { getClientDashboard, getProjectActivity, getProjectReport } from "@/lib/client-portal-api";
import { FolderOpen, CheckCircle, Clock, AlertCircle, ChevronRight, Activity, BarChart2, X, Download, User } from "lucide-react";

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: "#ecfdf5", color: "#059669", label: "On Track" },
  ON_HOLD:   { bg: "#fffbeb", color: "#d97706", label: "On Hold" },
  COMPLETED: { bg: "#eff6ff", color: "#2563eb", label: "Completed" },
};

const MILESTONE_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:     { bg: "#f1f5f9", color: "#64748b", label: "Pending" },
  IN_PROGRESS: { bg: "#eff6ff", color: "#2563eb", label: "In Progress" },
  COMPLETED:   { bg: "#ecfdf5", color: "#059669", label: "Completed" },
};

const DELIVERABLE_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING_REVIEW:     { bg: '#fffbeb', color: '#d97706', label: 'Pending' },
  APPROVED:           { bg: '#ecfdf5', color: '#059669', label: 'Approved' },
  REVISION_REQUESTED: { bg: '#fef2f2', color: '#dc2626', label: 'Revision' },
};

export default function ClientProjectsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'report'>('overview');

  useEffect(() => {
    getClientDashboard().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function openProject(project: any) {
    setSelectedProject(project);
    setActiveTab('overview');
    try {
      const [act, rep] = await Promise.all([getProjectActivity(project.id), getProjectReport(project.id)]);
      setActivity(Array.isArray(act) ? act : []);
      setReport(rep);
    } catch {}
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2563eb", borderTopColor: "transparent" }} />
    </div>
  );

  const projects = data?.projects || [];

  if (selectedProject) {
    const total = selectedProject.milestones.length;
    const done = selectedProject.milestones.filter((m: any) => m.status === "COMPLETED").length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const ps = STATUS_CONFIG[selectedProject.status] || STATUS_CONFIG.ACTIVE;

    return (
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedProject(null)} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors">
            ← Back to Projects
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-slate-900">{selectedProject.project_name}</h1>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                </div>
                <p className="text-sm text-slate-500">{selectedProject.company_name}</p>
                {selectedProject.description && <p className="text-sm text-slate-600 mt-2">{selectedProject.description}</p>}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">{pct}%</p>
                <p className="text-xs text-slate-400">Complete</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#2563eb,#7c3aed)' }} />
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-slate-100">
            {[
              { label: "Deliverables", value: selectedProject.deliverables.length },
              { label: "Milestones", value: `${done}/${total}` },
              { label: "Pending Review", value: selectedProject.deliverables.filter((d: any) => d.status === 'PENDING_REVIEW').length },
              { label: "Feedback", value: selectedProject.feedback.length },
            ].map(s => (
              <div key={s.label} className="p-4 text-center">
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
          {(['overview', 'activity', 'report'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Milestones */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-sm text-slate-900">Milestones</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {selectedProject.milestones.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No milestones yet</div>
                ) : selectedProject.milestones.map((m: any) => {
                  const ms = MILESTONE_STATUS[m.status] || MILESTONE_STATUS.PENDING;
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className={`w-2 h-2 rounded-full shrink-0`} style={{ background: ms.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{m.title}</p>
                        {m.due_date && <p className="text-xs text-slate-400">Due {new Date(m.due_date).toLocaleDateString()}</p>}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ms.bg, color: ms.color }}>{ms.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deliverables */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-sm text-slate-900">Deliverables</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {selectedProject.deliverables.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No deliverables yet</div>
                ) : selectedProject.deliverables.slice(0, 6).map((d: any) => {
                  const ds = DELIVERABLE_STATUS[d.status] || { bg: '#f1f5f9', color: '#64748b', label: d.status };
                  return (
                    <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FolderOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{d.title}</p>
                        <p className="text-xs text-slate-400">v{d.version}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ds.bg, color: ds.color }}>{ds.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Manager */}
            {selectedProject.manager && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-sm text-slate-900 mb-3">Project Manager</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                    {selectedProject.manager.avatar_url
                      ? <img src={selectedProject.manager.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                      : selectedProject.manager.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{selectedProject.manager.name}</p>
                    <p className="text-xs text-slate-400">{selectedProject.manager.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900">Project Activity</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {activity.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">No activity yet</div>
              ) : activity.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3 px-5 py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${item.type === 'DELIVERABLE' ? 'bg-blue-500' : item.type === 'MILESTONE' ? 'bg-purple-500' : 'bg-green-500'}`}>
                    {item.type === 'DELIVERABLE' ? 'D' : item.type === 'MILESTONE' ? 'M' : 'F'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{item.action}</p>
                    {item.actor && <p className="text-xs text-slate-400 mt-0.5">by {item.actor.name}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(item.date).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'report' && report && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Progress", value: `${report.summary.progressPct}%`, color: "#2563eb" },
                { label: "Milestones Done", value: `${report.summary.completedMilestones}/${report.summary.totalMilestones}`, color: "#7c3aed" },
                { label: "Deliverables Approved", value: `${report.summary.approvedDeliverables}/${report.summary.totalDeliverables}`, color: "#059669" },
                { label: "Pending Review", value: report.summary.pendingDeliverables, color: "#d97706" },
                { label: "Change Requests", value: report.summary.changeRequests, color: "#dc2626" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
        <p className="text-sm text-slate-500 mt-1">Click a project to view details, activity, and reports</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="h-14 w-14 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">No projects assigned yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project: any) => {
            const total = project.milestones.length;
            const done = project.milestones.filter((m: any) => m.status === "COMPLETED").length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const ps = STATUS_CONFIG[project.status] || STATUS_CONFIG.ACTIVE;
            const pending = project.deliverables.filter((d: any) => d.status === 'PENDING_REVIEW').length;

            return (
              <button key={project.id} onClick={() => openProject(project)}
                className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                      {project.project_name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{project.project_name}</p>
                      <p className="text-xs text-slate-400">{project.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pending > 0 && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">{pending} pending</span>}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                  </div>
                </div>
                {project.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{project.description}</p>}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#2563eb,#7c3aed)' }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{pct}%</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span>{project.deliverables.length} deliverables</span>
                    <span>{done}/{total} milestones</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
