"use client";
import { useEffect, useState } from "react";
import { getClientDashboard, approveDeliverable, rejectDeliverable } from "@/lib/client-portal-api";
import { FileText, CheckCircle, Clock, X, Download, Filter, Search } from "lucide-react";

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  PENDING_REVIEW:     { bg: "#fffbeb", color: "#d97706", label: "Pending Review" },
  APPROVED:           { bg: "#ecfdf5", color: "#059669", label: "Approved" },
  REVISION_REQUESTED: { bg: "#fef2f2", color: "#dc2626", label: "Revision Requested" },
};

export default function ClientDeliverablesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
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

  const filtered = allDeliverables.filter((d: any) => {
    const matchFilter = filter === "ALL" || d.status === filter;
    const matchSearch = !search.trim() || d.title.toLowerCase().includes(search.toLowerCase()) || d.project_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = {
    ALL: allDeliverables.length,
    PENDING_REVIEW: allDeliverables.filter((d: any) => d.status === "PENDING_REVIEW").length,
    APPROVED: allDeliverables.filter((d: any) => d.status === "APPROVED").length,
    REVISION_REQUESTED: allDeliverables.filter((d: any) => d.status === "REVISION_REQUESTED").length,
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2563eb", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deliverables</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve work submitted by your project team</p>
        </div>
        {counts.PENDING_REVIEW > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">{counts.PENDING_REVIEW} awaiting review</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deliverables..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors bg-white" />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(["ALL", "PENDING_REVIEW", "APPROVED", "REVISION_REQUESTED"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {f === "ALL" ? `All (${counts.ALL})` : f === "PENDING_REVIEW" ? `Pending (${counts.PENDING_REVIEW})` : f === "APPROVED" ? `Approved (${counts.APPROVED})` : `Revision (${counts.REVISION_REQUESTED})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="h-14 w-14 mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">No deliverables found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d: any) => {
            const s = STATUS_CONFIG[d.status] || STATUS_CONFIG.PENDING_REVIEW;
            return (
              <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{d.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{d.project_name} · Version {d.version}</p>
                        {d.description && <p className="text-sm text-slate-600 mt-1">{d.description}</p>}
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>

                    {d.feedback && (
                      <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                        "{d.feedback}"
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-slate-400">Submitted {new Date(d.created_at).toLocaleDateString()}</p>
                      <div className="flex items-center gap-2">
                        {d.file_url && (
                          <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        )}
                        {d.status === "PENDING_REVIEW" && (
                          <>
                            <button onClick={() => handleApprove(d.id)} disabled={acting === d.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
                              {acting === d.id ? "..." : "Approve"}
                            </button>
                            <button onClick={() => setRejectModal(d)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                              Request Revision
                            </button>
                          </>
                        )}
                        {d.status === "APPROVED" && (
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                            <CheckCircle className="h-3.5 w-3.5" /> Approved by you
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 bg-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">Request Revision</h3>
              <button onClick={() => setRejectModal(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Describe the changes needed for <strong>{rejectModal.title}</strong>.</p>
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
