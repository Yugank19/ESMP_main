"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, FileText, AlertCircle, TrendingUp, ChevronRight, X } from "lucide-react";
import { getClientDashboard, approveDeliverable, rejectDeliverable, addFeedback } from "@/lib/client-portal-api";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING_REVIEW:      { bg: "#fffbeb", color: "#d97706", label: "Pending Review" },
  APPROVED:            { bg: "#ecfdf5", color: "#059669", label: "Approved" },
  REJECTED:            { bg: "#fef2f2", color: "#dc2626", label: "Rejected" },
  REVISION_REQUESTED:  { bg: "#fef2f2", color: "#dc2626", label: "Revision Requested" },
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [feedbackModal, setFeedbackModal] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [acting, setActing] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
    load();
  }, []);

  async function load() {
    setLoading(true);
    try { const d = await getClientDashboard(); setData(d); } catch {}
    setLoading(false);
  }

  async function handleApprove(deliverableId: string) {
    setActing(deliverableId);
    try { await approveDeliverable(deliverableId); load(); } catch {}
    setActing("");
  }

  async function handleReject() {
    if (!rejectModal || !rejectFeedback.trim()) return;
    setActing(rejectModal.id);
    try { await rejectDeliverable(rejectModal.id, rejectFeedback); setRejectModal(null); setRejectFeedback(""); load(); } catch {}
    setActing("");
  }

  async function handleFeedback() {
    if (!feedbackModal || !feedbackText.trim()) return;
    try { await addFeedback(feedbackModal.project_id, feedbackText); setFeedbackModal(null); setFeedbackText(""); load(); } catch {}
  }

  if (loading || !user) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2563eb", borderTopColor: "transparent" }} />
    </div>
  );

  const stats = data?.stats || {};
  const projects = data?.projects || [];
  const allDeliverables = projects.flatMap((p: any) => p.deliverables.map((d: any) => ({ ...d, project_name: p.project_name, project_id: p.id })));
  const pendingDeliverables = allDeliverables.filter((d: any) => d.status === "PENDING_REVIEW");
  const recentActivity = projects.flatMap((p: any) => p.feedback.map((f: any) => ({ ...f, project_name: p.project_name }))).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
              {greeting}, {firstName}
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              {stats.pendingReviews > 0
                ? `You have ${stats.pendingReviews} deliverable${stats.pendingReviews > 1 ? "s" : ""} awaiting your review.`
                : "Your portfolio is up to date. No pending actions."}
            </p>
          </div>

          {/* Project Momentum */}
          <div className="rounded-2xl border p-6" style={{ borderColor: "#f1f5f9" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base" style={{ color: "#0f172a" }}>Project Momentum</h2>
              <Link href="/client-dashboard/projects" className="text-sm font-semibold flex items-center gap-1" style={{ color: "#2563eb" }}>
                View Timeline <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-10 w-10 mx-auto mb-2" style={{ color: "#e2e8f0" }} />
                <p className="text-sm" style={{ color: "#94a3b8" }}>No projects assigned yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {projects.map((project: any) => {
                  const total = project.milestones.length;
                  const done = project.milestones.filter((m: any) => m.status === "COMPLETED").length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <div key={project.id}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#0f172a" }}>{project.project_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{project.description || project.company_name}</p>
                        </div>
                        <span className="text-sm font-bold" style={{ color: "#2563eb" }}>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#2563eb,#7c3aed)" }} />
                      </div>
                      {project.milestones.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {project.milestones.slice(0, 4).map((m: any) => (
                            <div key={m.id} className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                              style={{ background: m.status === "COMPLETED" ? "#ecfdf5" : m.status === "IN_PROGRESS" ? "#eff6ff" : "#f8fafc", color: m.status === "COMPLETED" ? "#059669" : m.status === "IN_PROGRESS" ? "#2563eb" : "#94a3b8" }}>
                              {m.status === "COMPLETED" ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {m.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Portfolio Health */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border p-5" style={{ borderColor: "#f1f5f9" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Portfolio Health</p>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 60 60" className="w-16 h-16 -rotate-90">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle cx="30" cy="30" r="24" fill="none" stroke="#2563eb" strokeWidth="8"
                      strokeDasharray={`${(stats.completedMilestones / Math.max(stats.totalMilestones, 1)) * 150} 150`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold" style={{ color: "#2563eb" }}>
                      {stats.totalMilestones > 0 ? Math.round((stats.completedMilestones / stats.totalMilestones) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                    {stats.completedMilestones >= stats.totalMilestones * 0.8 ? "Excellent" : stats.completedMilestones >= stats.totalMilestones * 0.5 ? "Good" : "In Progress"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{stats.completedMilestones}/{stats.totalMilestones} milestones</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border p-5" style={{ borderColor: "#f1f5f9" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>Deliverables</p>
              <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>{stats.totalDeliverables}</p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Total submitted</p>
              <div className="flex items-center gap-1.5 mt-2">
                {stats.pendingReviews > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fffbeb", color: "#d97706" }}>
                    {stats.pendingReviews} pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border p-4" style={{ borderColor: "#f1f5f9" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Active Projects</p>
              <p className="text-3xl font-bold" style={{ color: "#0f172a" }}>{String(stats.totalProjects).padStart(2, "0")}</p>
              <p className="text-xs mt-1" style={{ color: "#059669" }}>+{stats.totalProjects} total</p>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: "#f1f5f9" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Pending Reviews</p>
              <p className="text-3xl font-bold" style={{ color: stats.pendingReviews > 0 ? "#dc2626" : "#0f172a" }}>
                {String(stats.pendingReviews).padStart(2, "0")}
              </p>
              {stats.pendingReviews > 0 && <p className="text-xs mt-1 font-semibold" style={{ color: "#dc2626" }}>! High priority</p>}
            </div>
          </div>

          {/* Deliverables Review */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#f1f5f9" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#f1f5f9" }}>
              <h3 className="font-bold text-sm" style={{ color: "#0f172a" }}>Deliverables Review</h3>
              {pendingDeliverables.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#dc2626" }}>
                  REQUIRES ACTION
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              {pendingDeliverables.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2" style={{ color: "#e2e8f0" }} />
                  <p className="text-xs" style={{ color: "#94a3b8" }}>No pending reviews</p>
                </div>
              ) : (
                pendingDeliverables.slice(0, 3).map((d: any) => (
                  <div key={d.id} className="rounded-xl p-3.5" style={{ background: "#f8fafc" }}>
                    <div className="flex items-start gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                        <FileText className="h-4 w-4" style={{ color: "#2563eb" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>{d.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>v{d.version} · {d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB` : "Document"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(d.id)} disabled={acting === d.id}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                        style={{ background: "#2563eb" }}>
                        {acting === d.id ? "..." : "APPROVE"}
                      </button>
                      <button onClick={() => setRejectModal(d)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
                        style={{ background: "#f1f5f9", color: "#64748b" }}>
                        REVIEW
                      </button>
                    </div>
                  </div>
                ))
              )}
              {pendingDeliverables.length > 3 && (
                <Link href="/client-dashboard/deliverables" className="block text-center text-xs font-semibold py-2" style={{ color: "#2563eb" }}>
                  View all {pendingDeliverables.length} →
                </Link>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#f1f5f9" }}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#f1f5f9" }}>
              <h3 className="font-bold text-sm" style={{ color: "#0f172a" }}>Recent Activity</h3>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "#94a3b8" }}>No recent activity</p>
              ) : (
                recentActivity.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}>
                      {item.author?.name?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs" style={{ color: "#0f172a" }}>
                        <span className="font-semibold">{item.author?.name}</span>{" "}
                        {item.type === "APPROVAL" ? "approved" : item.type === "REJECTION" ? "requested revision on" : "commented on"}{" "}
                        <span className="font-semibold" style={{ color: "#2563eb" }}>{item.project_name}</span>
                      </p>
                      <p className="text-xs mt-0.5 line-clamp-2 italic" style={{ color: "#64748b" }}>"{item.body}"</p>
                      <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 bg-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: "#0f172a" }}>Request Revision</h3>
              <button onClick={() => setRejectModal(null)}><X className="h-5 w-5" style={{ color: "#94a3b8" }} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: "#64748b" }}>Please describe what changes are needed for <strong>{rejectModal.title}</strong>.</p>
            <textarea rows={4} value={rejectFeedback} onChange={e => setRejectFeedback(e.target.value)}
              placeholder="Describe the required changes..."
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ borderColor: "#e2e8f0" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#2563eb")}
              onBlur={e => (e.currentTarget.style.borderColor = "#e2e8f0")} />
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={!rejectFeedback.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "#dc2626" }}>
                Request Revision
              </button>
              <button onClick={() => setRejectModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}