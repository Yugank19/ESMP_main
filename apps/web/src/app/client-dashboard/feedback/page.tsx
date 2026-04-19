"use client";
import { useEffect, useState } from "react";
import { getClientDashboard, addFeedback } from "@/lib/client-portal-api";
import { MessageSquare, Send, CheckCircle, AlertTriangle, Search } from "lucide-react";

const TYPE_CONFIG: Record<string, { bg: string; color: string; label: string; icon: any }> = {
  COMMENT:        { bg: "#eff6ff", color: "#2563eb", label: "Comment", icon: MessageSquare },
  CHANGE_REQUEST: { bg: "#fffbeb", color: "#d97706", label: "Change Request", icon: AlertTriangle },
  APPROVAL:       { bg: "#ecfdf5", color: "#059669", label: "Approval", icon: CheckCircle },
  REJECTION:      { bg: "#fef2f2", color: "#dc2626", label: "Revision Request", icon: AlertTriangle },
};

export default function ClientFeedbackPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("COMMENT");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  async function load() {
    setLoading(true);
    try {
      const d = await getClientDashboard();
      setData(d);
      if (d.projects?.[0]) setSelectedProject(d.projects[0].id);
    } catch {}
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

  const filtered = allFeedback.filter((f: any) => {
    const matchType = filterType === "ALL" || f.type === filterType;
    const matchSearch = !search.trim() || f.body.toLowerCase().includes(search.toLowerCase()) || f.project_name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2563eb", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Feedback & Communication</h1>
        <p className="text-sm text-slate-500 mt-1">Submit comments and change requests to your project team</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-6">
            <h2 className="font-semibold text-slate-900 mb-4">New Message</h2>
            {success && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                <CheckCircle className="h-4 w-4" /> Sent successfully
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3">
              {projects.length > 1 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Project</label>
                  <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors bg-white">
                    {projects.map((p: any) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
                <div className="flex gap-2">
                  {["COMMENT", "CHANGE_REQUEST"].map(t => (
                    <button key={t} type="button" onClick={() => setFeedbackType(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${feedbackType === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                      {t === "COMMENT" ? "💬 Comment" : "🔄 Change Request"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Message *</label>
                <textarea rows={5} required value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                  placeholder={feedbackType === "COMMENT" ? "Share your thoughts..." : "Describe the changes you need..."}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-500 transition-colors" />
              </div>
              <button type="submit" disabled={sending || !feedbackText.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
                <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900">Message History</h2>
                <span className="text-xs text-slate-400">{allFeedback.length} total</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages..."
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-colors" />
                </div>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-blue-500 bg-white">
                  <option value="ALL">All Types</option>
                  <option value="COMMENT">Comments</option>
                  <option value="CHANGE_REQUEST">Change Requests</option>
                  <option value="APPROVAL">Approvals</option>
                  <option value="REJECTION">Revisions</option>
                </select>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-200" />
                <p className="font-medium text-slate-400">No messages yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filtered.map((f: any) => {
                  const t = TYPE_CONFIG[f.type] || TYPE_CONFIG.COMMENT;
                  const Icon = t.icon;
                  return (
                    <div key={f.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}>
                          {f.author?.name?.[0] || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900">{f.author?.name || "You"}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: t.bg, color: t.color }}>
                              <Icon className="h-2.5 w-2.5" /> {t.label}
                            </span>
                            <span className="text-xs text-slate-400">{f.project_name}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{f.body}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{new Date(f.created_at).toLocaleString()}</p>
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
