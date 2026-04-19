"use client";
import { useEffect, useState } from "react";
import { getClientDashboard } from "@/lib/client-portal-api";
import { Target, CheckCircle, Clock, Circle, Calendar } from "lucide-react";

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string; icon: any }> = {
  PENDING:     { bg: "#f1f5f9", color: "#64748b", label: "Pending", icon: Circle },
  IN_PROGRESS: { bg: "#eff6ff", color: "#2563eb", label: "In Progress", icon: Clock },
  COMPLETED:   { bg: "#ecfdf5", color: "#059669", label: "Completed", icon: CheckCircle },
};

export default function ClientMilestonesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    getClientDashboard().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2563eb", borderTopColor: "transparent" }} />
    </div>
  );

  const projects = data?.projects || [];
  const allMilestones = projects.flatMap((p: any) =>
    p.milestones.map((m: any) => ({ ...m, project_name: p.project_name }))
  );

  const filtered = filter === "ALL" ? allMilestones : allMilestones.filter((m: any) => m.status === filter);
  const completed = allMilestones.filter((m: any) => m.status === "COMPLETED").length;
  const inProgress = allMilestones.filter((m: any) => m.status === "IN_PROGRESS").length;
  const pending = allMilestones.filter((m: any) => m.status === "PENDING").length;
  const pct = allMilestones.length > 0 ? Math.round((completed / allMilestones.length) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Milestones</h1>
        <p className="text-sm text-slate-500 mt-1">Track key project milestones and delivery targets</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: allMilestones.length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Completed", value: completed, color: "#059669", bg: "#ecfdf5" },
          { label: "In Progress", value: inProgress, color: "#d97706", bg: "#fffbeb" },
          { label: "Pending", value: pending, color: "#64748b", bg: "#f1f5f9" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      {allMilestones.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-900">Overall Completion</span>
            <span className="text-sm font-bold text-blue-600">{pct}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#2563eb,#7c3aed)" }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">{completed} of {allMilestones.length} milestones completed</p>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {f === "ALL" ? "All" : f === "IN_PROGRESS" ? "In Progress" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Milestones by project */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Target className="h-14 w-14 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">No milestones found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.filter((p: any) => p.milestones.some((m: any) => filter === "ALL" || m.status === filter)).map((project: any) => {
            const projectMilestones = project.milestones.filter((m: any) => filter === "ALL" || m.status === filter);
            if (projectMilestones.length === 0) return null;
            return (
              <div key={project.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
                  <p className="font-semibold text-sm text-slate-900">{project.project_name}</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {projectMilestones.map((m: any) => {
                    const s = STATUS_CONFIG[m.status] || STATUS_CONFIG.PENDING;
                    const Icon = s.icon;
                    const isOverdue = m.due_date && new Date(m.due_date) < new Date() && m.status !== 'COMPLETED';
                    return (
                      <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                          <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: s.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900">{m.title}</p>
                          {m.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{m.description}</p>}
                          {m.due_date && (
                            <div className={`flex items-center gap-1 mt-1 text-xs ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                              <Calendar className="h-3 w-3" />
                              {isOverdue ? 'Overdue · ' : 'Due '}
                              {new Date(m.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
