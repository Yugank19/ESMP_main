"use client";
import { useEffect, useState } from "react";
import { getClientDashboard, approveDeliverable, rejectDeliverable } from "@/lib/client-portal-api";
import { FileText, CheckCircle, Clock, X, Filter } from "lucide-react";

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  PENDING_REVIEW:     { bg: "#fffbeb", color: "#d97706", label: "Pending Review" },
  APPROVED:           { bg: "#ecfdf5", color: "#059669", label: "Approved" },
  REVISION_REQUESTED: { bg: "#fef2f2", color: "#dc2626", label: "Revision Requested" },
};

export default function ClientDeliverablesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [rejectModal, setRejectModal] = useState<any>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");
  const [acting, setActing] = useState("");

  async function load() {
    setLoading(true);
    try { const d = await getClientDashboard(); setData(d); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id: string) {
    setActing(id);
    try { await approveDeliverable(id); load(); } catch {}
    setActing("");
  }

  async function handleReject() {
    if (!rejectModal || !rejectFeedback.trim()) return;
    setActing(rejectModal.id);
    try { await rejectDeliverable(rejectModal.id, rejectFeedback); setRejectModal(null); setRejectFeedback(""); load(); } catch {}
    setActing("");
  }

  const projects = data?.projects || [];
  const allDeliverables = projects.flatMap((p: any) =>
    p.deliverables.map((d: any) => ({ ...d, project_name: p.project_name, project_id: p.id }))
  );
  const filtered = filter === "ALL" ? allDeliverables : allDeliverables.filter((d: any) => d.status === filter);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2563eb", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>Deliverables</h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>Review and approve work submitted by your project team</p>
        </div>
        <div className="flex items-center gap-2">
          {["ALL", "PENDING_REVIEW", "APPROVED", "REVISION_REQUESTED"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: filter === f ? "#2563eb" : "#f1f5f9", color: filter === f ? "#fff" : "#64748b" }}>
              {f === "ALL" ? "All" : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-14 w-14 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
          <p className="font-semibold" style={{ color: "#64748b" }}>No deliverables found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((d: any) => {
            const s = STATUS_CONFIG[d.status] || STATUS_CONFIG.PENDING_REVIEW;
            return (
              <div key={d.id} className="rounded-2xl border p-5" style={{ borderColor: "#f1f5f9" }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#eff6ff" }}>
                    <FileText className="h-5 w-5" style={{ color: "#2563eb" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "#0f172a" }}>{d.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{d.project_name} · v{d.version}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                </div>

                {d.description && <p className="text-xs mb-4 line-clamp-2" style={{ color: "#64748b" }}>{d.description}</p>}

                {d.feedback && (
                  <div className="rounded-lg p-2.5 mb-4 text-xs italic" style={{ background: "#f8fafc", color: "#64748b" }}>
                    "{d.feedback}"
                  </div>
                )}

                <p className="text-[10px] mb-3" style={{ color: "#94a3b8" }}>
                  Submitted {new Date(d.created_at).toLocaleDateString()}
                </p>

                {d.status === "PENDING_REVIEW" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(d.id)} disabled={acting === d.id}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                      style={{ background: "#2563eb" }}>
                      {acting === d.id ? "..." : "Approve"}
                    </button>
                    <button onClick={() => setRejectModal(d)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold"
                      style={{ background: "#f1f5f9", color: "#64748b" }}>
                      Request Revision
                    </button>
                  </div>
                )}
                {d.status === "APPROVED" && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#059669" }}>
                    <CheckCircle className="h-3.5 w-3.5" /> Approved by you
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 bg-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: "#0f172a" }}>Request Revision</h3>
              <button onClick={() => setRejectModal(null)}><X className="h-5 w-5" style={{ color: "#94a3b8" }} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: "#64748b" }}>Describe the changes needed for <strong>{rejectModal.title}</strong>.</p>
            <textarea rows={4} value={rejectFeedback} onChange={e => setRejectFeedback(e.target.value)}
              placeholder="Describe the required changes..."
              className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ borderColor: "#e2e8f0" }} />
            <div className="flex gap-3 mt-4">
              <button onClick={handleReject} disabled={!rejectFeedback.trim() || acting === rejectModal.id}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "#dc2626" }}>
                {acting === rejectModal.id ? "Sending..." : "Request Revision"}
              </button>
              <button onClick={() => setRejectModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm border" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
