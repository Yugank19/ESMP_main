"use client";
import { useEffect, useState } from "react";
import { getClientDashboard, addFeedback } from "@/lib/client-portal-api";
import { MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";

const TYPE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  COMMENT:        { bg: "#eff6ff", color: "#2563eb", label: "Comment" },
  CHANGE_REQUEST: { bg: "#fffbeb", color: "#d97706", label: "Change Request" },
  APPROVAL:       { bg: "#ecfdf5", color: "#059669", label: "Approval" },
  REJECTION:      { bg: "#fef2f2", color: "#dc2626", label: "Revision Request" },
};

export default function ClientFeedbackPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("COMMENT");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function load() {
    setLoading(true);
    try { const d = await getClientDashboard(); setData(d); if (d.projects?.[0]) setSelectedProject(d.projects[0].id); } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject || !feedbackText.trim()) return;
    setSending(true);
    try {
      await addFeedback(selectedProject, feedbackText, feedbackType);
      setFeedbackText("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      load();
    } catch {}
    setSending(false);
  }

  const projects = data?.projects || [];
  const allFeedback = projects.flatMap((p: any) =>
    p.feedback.map((f: any) => ({ ...f, project_name: p.project_name }))
  ).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2563eb", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>Feedback</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Submit comments and change requests to your project team</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Submit feedback */}
        <div className="xl:col-span-1">
          <div className="rounded-2xl border p-5" style={{ borderColor: "#f1f5f9" }}>
            <h2 className="font-bold text-sm mb-4" style={{ color: "#0f172a" }}>Submit Feedback</h2>
            {success && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: "#ecfdf5", color: "#059669" }}>
                <CheckCircle className="h-4 w-4" /> Feedback sent successfully
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              {projects.length > 1 && (
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "#64748b" }}>Project</label>
                  <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "#e2e8f0", background: "#f8fafc", color: "#0f172a" }}>
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#64748b" }}>Type</label>
                <div className="flex gap-2">
                  {["COMMENT", "CHANGE_REQUEST"].map(t => (
                    <button key={t} type="button" onClick={() => setFeedbackType(t)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
                      style={{ background: feedbackType === t ? "#2563eb" : "#f1f5f9", color: feedbackType === t ? "#fff" : "#64748b" }}>
                      {t === "COMMENT" ? "Comment" : "Change Request"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#64748b" }}>Message *</label>
                <textarea rows={5} required value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                  placeholder={feedbackType === "COMMENT" ? "Share your thoughts..." : "Describe the changes you need..."}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ borderColor: "#e2e8f0" }} />
              </div>
              <button type="submit" disabled={sending || !feedbackText.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "#2563eb" }}>
                <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Feedback"}
              </button>
            </form>
          </div>
        </div>

        {/* Feedback history */}
        <div className="xl:col-span-2">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#f1f5f9" }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: "#f1f5f9" }}>
              <h2 className="font-bold text-sm" style={{ color: "#0f172a" }}>Feedback History</h2>
            </div>
            {allFeedback.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: "#e2e8f0" }} />
                <p className="font-medium" style={{ color: "#64748b" }}>No feedback yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                {allFeedback.map((f: any) => {
                  const t = TYPE_CONFIG[f.type] || TYPE_CONFIG.COMMENT;
                  return (
                    <div key={f.id} className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}>
                          {f.author?.name?.[0] || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold" style={{ color: "#0f172a" }}>{f.author?.name || "You"}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.color }}>{t.label}</span>
                            <span className="text-xs" style={{ color: "#94a3b8" }}>{f.project_name}</span>
                          </div>
                          <p className="text-sm" style={{ color: "#374151" }}>{f.body}</p>
                          <p className="text-[10px] mt-1" style={{ color: "#94a3b8" }}>{new Date(f.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
