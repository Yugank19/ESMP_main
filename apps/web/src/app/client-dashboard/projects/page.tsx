"use client";
import { useEffect, useState } from "react";
import { getClientDashboard } from "@/lib/client-portal-api";
import { FolderOpen, CheckCircle, Clock, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

const MILESTONE_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  NOT_STARTED: { bg: "#f1f5f9", color: "#64748b", label: "Not Started" },
  IN_PROGRESS: { bg: "#eff6ff", color: "#2563eb", label: "In Progress" },
  COMPLETED:   { bg: "#ecfdf5", color: "#059669", label: "Completed" },
};

export default function ClientProjectsPage() {
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

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>My Projects</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Overview of all your assigned projects and their progress</p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="h-14 w-14 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-semibold" style={{ color: "#64748b" }}>No projects assigned yet</p>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Your manager will assign projects to you</p>
        </div>
      ) : (
        <div className="space-y-5">
          {projects.map((project: any) => {
            const total = project.milestones.length;
            const done = project.milestones.filter((m: any) => m.status === "COMPLETED").length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const pendingDeliverables = project.deliverables.filter((d: any) => d.status === "PENDING_REVIEW").length;

            return (
              <div key={project.id} className="rounded-2xl border p-6" style={{ borderColor: "#f1f5f9" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#0f172a" }}>{project.project_name}</h2>
                    <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{project.company_name}</p>
                    {project.description && <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>{project.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingDeliverables > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "#fffbeb", color: "#d97706" }}>
                        {pendingDeliverables} pending review
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: project.is_active ? "#ecfdf5" : "#f1f5f9", color: project.is_active ? "#059669" : "#64748b" }}>
                      {project.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: "#64748b" }}>Overall Progress</span>
                    <span className="text-sm font-bold" style={{ color: "#2563eb" }}>{pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#2563eb,#7c3aed)" }} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Deliverables", value: project.deliverables.length, icon: CheckCircle, color: "#2563eb" },
                    { label: "Milestones", value: `${done}/${total}`, icon: Clock, color: "#7c3aed" },
                    { label: "Feedback", value: project.feedback.length, icon: AlertCircle, color: "#059669" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "#f8fafc" }}>
                      <p className="text-lg font-bold" style={{ color: "#0f172a" }}>{s.value}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Milestones */}
                {project.milestones.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: "#64748b" }}>Milestones</p>
                    <div className="flex flex-wrap gap-2">
                      {project.milestones.map((m: any) => {
                        const s = MILESTONE_STATUS[m.status] || MILESTONE_STATUS.NOT_STARTED;
                        return (
                          <div key={m.id} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ background: s.bg, color: s.color }}>
                            {m.status === "COMPLETED" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {m.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Manager */}
                {project.manager && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: "#f1f5f9" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}>
                      {project.manager.name?.[0] || "M"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#0f172a" }}>{project.manager.name}</p>
                      <p className="text-[10px]" style={{ color: "#94a3b8" }}>Project Manager</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
