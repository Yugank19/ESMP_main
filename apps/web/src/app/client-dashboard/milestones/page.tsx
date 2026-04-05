"use client";
import { useEffect, useState } from "react";
import { getClientDashboard } from "@/lib/client-portal-api";
import { Target, CheckCircle, Clock, Circle } from "lucide-react";

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string; icon: any }> = {
  NOT_STARTED: { bg: "#f1f5f9", color: "#64748b", label: "Not Started", icon: Circle },
  IN_PROGRESS: { bg: "#eff6ff", color: "#2563eb", label: "In Progress", icon: Clock },
  COMPLETED:   { bg: "#ecfdf5", color: "#059669", label: "Completed", icon: CheckCircle },
};

export default function ClientMilestonesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const completed = allMilestones.filter((m: any) => m.status === "COMPLETED").length;
  const inProgress = allMilestones.filter((m: any) => m.status === "IN_PROGRESS").length;
  const notStarted = allMilestones.filter((m: any) => m.status === "NOT_STARTED").length;
  const pct = allMilestones.length > 0 ? Math.round((completed / allMilestones.length) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>Milestones</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Track key project milestones and delivery targets</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: allMilestones.length, color: "#2563eb" },
          { label: "Completed", value: completed, color: "#059669" },
          { label: "In Progress", value: inProgress, color: "#d97706" },
          { label: "Not Started", value: notStarted, color: "#94a3b8" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4 text-center" style={{ borderColor: "#f1f5f9" }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {allMilestones.length > 0 && (
        <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "#f1f5f9" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: "#0f172a" }}>Overall Completion</span>
            <span className="text-sm font-bold" style={{ color: "#2563eb" }}>{pct}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#2563eb,#7c3aed)" }} />
          </div>
          <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>{completed} of {allMilestones.length} milestones completed</p>
        </div>
      )}

      {/* Milestones by project */}
      {projects.length === 0 || allMilestones.length === 0 ? (
        <div className="text-center py-20">
          <Target className="h-14 w-14 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-semibold" style={{ color: "#64748b" }}>No milestones yet</p>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Your manager will add milestones to your project</p>
        </div>
      ) : (
        <div className="space-y-5">
          {projects.filter((p: any) => p.milestones.length > 0).map((project: any) => (
            <div key={project.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: "#f1f5f9" }}>
              <div className="px-5 py-3.5 border-b" style={{ borderColor: "#f1f5f9", background: "#f8fafc" }}>
                <p className="font-semibold text-sm" style={{ color: "#0f172a" }}>{project.project_name}</p>
              </div>
              <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                {project.milestones.map((m: any) => {
                  const s = STATUS_CONFIG[m.status] || STATUS_CONFIG.NOT_STARTED;
                  const Icon = s.icon;
                  return (
                    <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                        <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: s.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: "#0f172a" }}>{m.title}</p>
                        {m.description && <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>{m.description}</p>}
                        {m.due_date && (
                          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                            Due: {new Date(m.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
