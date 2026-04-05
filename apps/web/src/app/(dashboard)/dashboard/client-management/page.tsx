"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Building2, Mail, Phone, Eye, EyeOff, X, CheckCircle, Clock, AlertCircle, ChevronRight, Trash2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function token() { return typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""; }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(opts.headers || {}) } });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || "Request failed"); }
  return r.json();
}

const ACCESS_TYPES = ["VIEW", "COMMENT", "APPROVE"];

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  ACTIVE:   { bg: "#ecfdf5", color: "#059669" },
  INACTIVE: { bg: "#f1f5f9", color: "#64748b" },
};

const DELIVERABLE_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING_REVIEW:     { bg: "#fffbeb", color: "#d97706", label: "Pending Review" },
  APPROVED:           { bg: "#ecfdf5", color: "#059669", label: "Approved" },
  REVISION_REQUESTED: { bg: "#fef2f2", color: "#dc2626", label: "Revision Needed" },
};

export default function ClientManagementPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  // Modals
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [deliverableModal, setDeliverableModal] = useState<any>(null);
  const [milestoneModal, setMilestoneModal] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Forms
  const [clientForm, setClientForm] = useState({ name: "", email: "", company_name: "", phone: "", project_name: "", description: "", access_type: "VIEW" });
  const [deliverableForm, setDeliverableForm] = useState({ title: "", description: "", version: "1" });
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", due_date: "", status: "NOT_STARTED" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/login"); return; }
    const u = JSON.parse(stored);
    const role = (u.roles?.[0] || "").toUpperCase();
    if (!["MANAGER", "ADMIN"].includes(role)) { router.replace("/dashboard"); return; }
    setUserRole(role);
    load();
  }, []);

  async function load() {
    setLoading(true);
    try { const d = await apiFetch("/client-portal/clients"); setClients(d); } catch {}
    setLoading(false);
  }

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch("/client-portal/clients", { method: "POST", body: JSON.stringify(clientForm) });
      setAddClientOpen(false);
      setClientForm({ name: "", email: "", company_name: "", phone: "", project_name: "", description: "", access_type: "VIEW" });
      load();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  }

  async function handleAddDeliverable(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch(`/client-portal/projects/${deliverableModal.id}/deliverables`, { method: "POST", body: JSON.stringify({ ...deliverableForm, version: parseInt(deliverableForm.version) || 1 }) });
      setDeliverableModal(null);
      setDeliverableForm({ title: "", description: "", version: "1" });
      load();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch(`/client-portal/projects/${milestoneModal.id}/milestones`, { method: "POST", body: JSON.stringify(milestoneForm) });
      setMilestoneModal(null);
      setMilestoneForm({ title: "", description: "", due_date: "", status: "NOT_STARTED" });
      load();
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  }

  async function toggleAccess(projectId: string, current: boolean) {
    try { await apiFetch(`/client-portal/projects/${projectId}`, { method: "PATCH", body: JSON.stringify({ is_active: !current }) }); load(); } catch {}
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#2563eb", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Client Management</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Manage client accounts, projects, deliverables and milestones</p>
        </div>
        <button onClick={() => setAddClientOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#2563eb" }}>
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Clients", value: clients.length, icon: Users, color: "#2563eb" },
          { label: "Active Projects", value: clients.filter(c => c.is_active).length, icon: CheckCircle, color: "#059669" },
          { label: "Pending Reviews", value: clients.flatMap((c: any) => c.deliverables || []).filter((d: any) => d.status === "PENDING_REVIEW").length, icon: Clock, color: "#d97706" },
          { label: "Companies", value: new Set(clients.map((c: any) => c.company_name)).size, icon: Building2, color: "#7c3aed" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.color + "18" }}>
                <s.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18, color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Client Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>All Clients</h2>
        </div>
        {clients.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="font-medium" style={{ color: "var(--text-secondary)" }}>No clients yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Click "Add Client" to create your first client account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Client", "Company", "Project", "Access", "Deliverables", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c: any) => {
                  const pending = (c.deliverables || []).filter((d: any) => d.status === "PENDING_REVIEW").length;
                  const total = (c.deliverables || []).length;
                  return (
                    <tr key={c.id} className="border-b last:border-0 transition-colors" style={{ borderColor: "var(--border)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-surface-2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}>
                            {c.client?.name?.[0] || "C"}
                          </div>
                          <div>
                            <p className="font-medium" style={{ color: "var(--text-primary)" }}>{c.client?.name}</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.client?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{c.company_name}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-xs" style={{ color: "var(--text-primary)" }}>{c.project_name}</p>
                        {c.description && <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: "var(--text-muted)" }}>{c.description}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#eff6ff", color: "#2563eb" }}>{c.access_type}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{total}</span>
                          {pending > 0 && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#fffbeb", color: "#d97706" }}>{pending} pending</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={c.is_active ? STATUS_BADGE.ACTIVE : STATUS_BADGE.INACTIVE}>
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setDeliverableModal(c)} title="Add Deliverable"
                            className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                            style={{ background: "#eff6ff", color: "#2563eb" }}>+ Deliverable</button>
                          <button onClick={() => setMilestoneModal(c)} title="Add Milestone"
                            className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                            style={{ background: "#f5f3ff", color: "#7c3aed" }}>+ Milestone</button>
                          <button onClick={() => toggleAccess(c.id, c.is_active)} title={c.is_active ? "Disable access" : "Enable access"}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: c.is_active ? "#059669" : "#94a3b8" }}>
                            {c.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {addClientOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6 shadow-2xl" style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Add New Client</h3>
              <button onClick={() => { setAddClientOpen(false); setError(""); }}><X className="h-5 w-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626" }}>{error}</div>}
            <form onSubmit={handleAddClient} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Client Name *</label>
                  <input required value={clientForm.name} onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Company Name *</label>
                  <input required value={clientForm.company_name} onChange={e => setClientForm(f => ({ ...f, company_name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Email (Gmail) *</label>
                  <input required type="email" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="client@gmail.com"
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Phone</label>
                  <input value={clientForm.phone} onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Project Name *</label>
                <input required value={clientForm.project_name} onChange={e => setClientForm(f => ({ ...f, project_name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Project Description</label>
                <textarea rows={2} value={clientForm.description} onChange={e => setClientForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Access Type</label>
                <select value={clientForm.access_type} onChange={e => setClientForm(f => ({ ...f, access_type: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}>
                  {ACCESS_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Login credentials will be emailed to the client automatically.</p>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "#2563eb" }}>{saving ? "Creating..." : "Create Client Account"}</button>
                <button type="button" onClick={() => { setAddClientOpen(false); setError(""); }}
                  className="px-4 py-2.5 rounded-xl text-sm border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deliverable Modal */}
      {deliverableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Add Deliverable</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>For: {deliverableModal.project_name}</p>
              </div>
              <button onClick={() => { setDeliverableModal(null); setError(""); }}><X className="h-5 w-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626" }}>{error}</div>}
            <form onSubmit={handleAddDeliverable} className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Title *</label>
                <input required value={deliverableForm.title} onChange={e => setDeliverableForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Description</label>
                <textarea rows={3} value={deliverableForm.description} onChange={e => setDeliverableForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Version</label>
                <input type="number" min="1" value={deliverableForm.version} onChange={e => setDeliverableForm(f => ({ ...f, version: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "#2563eb" }}>{saving ? "Adding..." : "Add Deliverable"}</button>
                <button type="button" onClick={() => { setDeliverableModal(null); setError(""); }}
                  className="px-4 py-2.5 rounded-xl text-sm border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {milestoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Add Milestone</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>For: {milestoneModal.project_name}</p>
              </div>
              <button onClick={() => { setMilestoneModal(null); setError(""); }}><X className="h-5 w-5" style={{ color: "var(--text-muted)" }} /></button>
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626" }}>{error}</div>}
            <form onSubmit={handleAddMilestone} className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Title *</label>
                <input required value={milestoneForm.title} onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Description</label>
                <textarea rows={2} value={milestoneForm.description} onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Due Date</label>
                  <input type="date" value={milestoneForm.due_date} onChange={e => setMilestoneForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-secondary)" }}>Status</label>
                  <select value={milestoneForm.status} onChange={e => setMilestoneForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border)", background: "var(--bg-surface-2)", color: "var(--text-primary)" }}>
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "#2563eb" }}>{saving ? "Adding..." : "Add Milestone"}</button>
                <button type="button" onClick={() => { setMilestoneModal(null); setError(""); }}
                  className="px-4 py-2.5 rounded-xl text-sm border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
