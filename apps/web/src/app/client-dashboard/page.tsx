"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Clock, FileText, AlertCircle, TrendingUp, ChevronRight,
  X, FolderOpen, Target, MessageSquare, Activity, ArrowUpRight,
  CheckCheck, AlertTriangle, Zap
} from "lucide-react";
import { getClientDashboard, approveDeliverable, rejectDeliverable, addFeedback } from "@/lib/client-portal-api";

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string; dot: string }> = {
  PENDING_REVIEW:     { bg: "#fffbeb", color: "#d97706", label: "Pending Review", dot: "#f59e0b" },
  APPROVED:           { bg: "#ecfdf5", color: "#059669", label: "Approved", dot: "#10b981" },
  REVISION_REQUESTED: { bg: "#fef2f2", color: "#dc2626", label: "Revision Needed", dot: "#ef4444" },
};

const PROJECT_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: "#ecfdf5", color: "#059669", label: "On Track" },
  ON_HOLD:   { bg: "#fffbeb", color: "#d97706", label: "On Hold" },
  COMPLETED: { bg: "#eff6ff", color: "#2563eb", label: "Completed" },
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");
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

  if (loading || !user) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2563eb", borderTopColor: "transparent" }} />
    </div>
  );

  const stats = data?.stats || {};
  const projects = data?.projects || [];
  const allDeliverables = projects.flatMap((p: any) => p.deliverables.map((d: any) => ({ ...d, project_name: p.project_name, project_id: p.id })));
  const pendingDeliverables = allDeliverables.filter((d: any) => d.status === "PENDING_REVIEW");
  const allMilestones = projects.flatMap((p: any) => p.milestones.map((m: any) => ({ ...m, project_name: p.project_name })));
  const upcomingMilestones = allMilestones.filter((m: any) => m.status !== 'COMPLETED').slice(0, 4);
  const recentActivity = projects.flatMap((p: any) => p.feedback.map((f: any) => ({ ...f, project_name: p.project_name }))).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  const firstName = user.name?.split(" ")[0] || "there";

  const summaryCards = [
    { label: "Total Projects", value: stats.totalProjects || 0, icon: FolderOpen, color: "#2563eb", bg: "#eff6ff", link: "/client-dashboard/projects" },
    { label: "Pending Reviews", value: stats.pendingReviews || 0, icon: Clock, color: "#d97706", bg: "#fffbeb", link: "/client-dashboard/deliverables" },
    { label: "Milestones Done", value: `${stats.completedMilestones || 0}/${stats.totalMilestones || 0}`, icon: Target, color: "#7c3aed", bg: "#f5f3ff", link: "/client-dashboard/milestones" },
    { label: "Deliverables", value: stats.totalDeliverables || 0, icon: FileText, color: "#059669", bg: "#ecfdf5", link: "/client-dashboard/deliverables" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}, {firstName} 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {stats.pendingReviews > 0
              ? `You have ${stats.pendingReviews} deliverable${stats.pendingReviews > 1 ? 's' : ''} awaiting your review.`
              : "Everything is up to date. No pending actions."}
          </p>
        </div>
        {stats.pendingReviews > 0 && (
          <Link href="/client-dashboard/deliverables"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#2563eb' }}>
            <Zap className="h-4 w-4" /> Review Now
          </Link>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <Link key={card.label} href={card.link}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: card.color }} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Projects + Milestones */}
        <div className="xl:col-span-2 space-y-5">
          {/* Projects */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Project Overview</h2>
              <Link href="/client-dashboard/projects" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="py-12 text-center">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400">No projects assigned yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {projects.map((project: any) => {
                  const total = project.milestones.length;
                  const done = project.milestones.filter((m: any) => m.status === "COMPLETED").length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const ps = PROJECT_STATUS[project.status] || PROJECT_STATUS.ACTIVE;
                  return (
                    <Link key={project.id} href={`/client-dashboard/projects`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                        {project.project_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-slate-900 truncate">{project.project_name}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#2563eb,#7c3aed)' }} />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 shrink-0">{pct}%</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming milestones */}
          {upcomingMilestones.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">Upcoming Milestones</h2>
                <Link href="/client-dashboard/milestones" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-slate-50">
                {upcomingMilestones.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.title}</p>
                      <p className="text-xs text-slate-400">{m.project_name}</p>
                    </div>
                    {m.due_date && (
                      <span className="text-xs text-slate-400 shrink-0">{new Date(m.due_date).toLocaleDateString()}</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${m.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {m.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Deliverables + Activity */}
        <div className="space-y-5">
          {/* Pending deliverables */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900">Deliverables Review</h3>
              {pendingDeliverables.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-red-500">
                  {pendingDeliverables.length} pending
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              {pendingDeliverables.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCheck className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs text-slate-400">All caught up!</p>
                </div>
              ) : pendingDeliverables.slice(0, 3).map((d: any) => (
                <div key={d.id} className="rounded-xl p-3.5 bg-slate-50 border border-slate-100">
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 shrink-0">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{d.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{d.project_name} · v{d.version}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(d.id)} disabled={acting === d.id}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
                      {acting === d.id ? "..." : "Approve"}
                    </button>
                    <button onClick={() => setRejectModal(d)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                      Request Revision
                    </button>
                  </div>
                </div>
              ))}
              {pendingDeliverables.length > 3 && (
                <Link href="/client-dashboard/deliverables" className="block text-center text-xs font-semibold text-blue-600 py-1 hover:underline">
                  View all {pendingDeliverables.length} →
                </Link>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-sm text-slate-900">Recent Activity</h3>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>
            <div className="divide-y divide-slate-50">
              {recentActivity.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No recent activity</div>
              ) : recentActivity.map((item: any) => (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                    {item.author?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700">
                      <span className="font-semibold">{item.author?.name}</span>{' '}
                      {item.type === 'APPROVAL' ? 'approved' : item.type === 'REJECTION' ? 'requested revision on' : 'commented on'}{' '}
                      <span className="font-semibold text-blue-600">{item.project_name}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 bg-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">Request Revision</h3>
              <button onClick={() => setRejectModal(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Describe what changes are needed for <strong>{rejectModal.title}</strong>.</p>
            <textarea rows={4} value={rejectFeedback} onChange={e => setRejectFeedback(e.target.value)}
              placeholder="Describe the required changes..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-500 transition-colors" />
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={!rejectFeedback.trim() || acting === rejectModal.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors">
                {acting === rejectModal.id ? "Sending..." : "Request Revision"}
              </button>
              <button onClick={() => setRejectModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
