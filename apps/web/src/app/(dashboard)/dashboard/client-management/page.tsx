"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    Plus, Users, Building2, Mail, Phone, Eye, EyeOff, X, 
    CheckCircle2, Clock, AlertCircle, ChevronRight, Trash2,
    Layout, Briefcase, Zap, Globe, Activity, ShieldCheck,
    Terminal, MoreHorizontal, ArrowLeft, Send, Target,
    FileText, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function token() { return typeof window !== "undefined" ? localStorage.getItem("token") || "" : ""; }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}`, ...(opts.headers || {}) } });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || "Request failed"); }
  return r.json();
}

const ACCESS_TYPES = ["VIEW", "COMMENT", "APPROVE"];

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE:   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100" },
  INACTIVE: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-100" },
};

const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase tracking-tight";
const labelClass = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 block pl-1";

export default function ClientManagementPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  const [addClientOpen, setAddClientOpen] = useState(false);
  const [deliverableModal, setDeliverableModal] = useState<any>(null);
  const [milestoneModal, setMilestoneModal] = useState<any>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const [clientForm, setClientForm] = useState({ name: "", email: "", company_name: "", phone: "", project_name: "", description: "", access_type: "VIEW" });
  const [deliverableForm, setDeliverableForm] = useState({ title: "", description: "", version: "1" });
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", due_date: "", status: "NOT_STARTED" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch("/client-portal/clients"); setClients(Array.isArray(d) ? d : []); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/login"); return; }
    const u = JSON.parse(stored);
    const role = (u.roles?.[0] || "").toUpperCase();
    if (!["MANAGER", "ADMIN"].includes(role)) { router.replace("/dashboard"); return; }
    setUserRole(role);
    load();
  }, [load, router]);

  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch("/client-portal/clients", { method: "POST", body: JSON.stringify(clientForm) });
      setAddClientOpen(false);
      setClientForm({ name: "", email: "", company_name: "", phone: "", project_name: "", description: "", access_type: "VIEW" });
      load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleAddDeliverable(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch(`/client-portal/projects/${deliverableModal.id}/deliverables`, { method: "POST", body: JSON.stringify({ ...deliverableForm, version: parseInt(deliverableForm.version) || 1 }) });
      setDeliverableModal(null);
      setDeliverableForm({ title: "", description: "", version: "1" });
      load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await apiFetch(`/client-portal/projects/${milestoneModal.id}/milestones`, { method: "POST", body: JSON.stringify(milestoneForm) });
      setMilestoneModal(null);
      setMilestoneForm({ title: "", description: "", due_date: "", status: "NOT_STARTED" });
      load();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function toggleAccess(projectId: string, current: boolean) {
    try { await apiFetch(`/client-portal/projects/${projectId}`, { method: "PATCH", body: JSON.stringify({ is_active: !current }) }); load(); } catch {}
  }

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2.5 rounded-[3px] bg-white border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Client Engagement Hub</h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Management of stakeholder accounts, project deliverables, and mission milestones</p>
          </div>
        </div>
        <button onClick={() => setAddClientOpen(true)}
          className="jira-button jira-button-primary h-12 px-8 gap-3 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" /> Add Client
        </button>
      </div>

      {/* High-Fidelity Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Stakeholders", value: clients.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", desc: "Registered point-of-contact units" },
          { label: "Engaged Projects", value: clients.filter(c => c.is_active).length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", desc: "Live operational environments" },
          { label: "Triage Requests", value: clients.flatMap((c: any) => c.deliverables || []).filter((d: any) => d.status === "PENDING_REVIEW").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", desc: "Deliverables awaiting authorization" },
          { label: "Partner Entities", value: new Set(clients.map((c: any) => c.company_name)).size, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", desc: "Unique corporate organizations" },
        ].map(s => (
          <div key={s.label} className="card p-6 border-[var(--border)] hover:border-[var(--color-primary)] transition-all group">
            <div className="flex items-start justify-between mb-4">
                 <div className={cn("w-12 h-12 rounded-[3px] flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110", s.bg, s.border)}>
                    <s.icon className={cn("h-6 w-6", s.color)} />
                 </div>
                 <Zap className="h-4 w-4 text-slate-100 group-hover:text-blue-100 transition-colors" />
            </div>
            <div>
              <p className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{s.value}</p>
              <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest mt-1">{s.label}</p>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter mt-1 opacity-60">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Registry Table */}
      <div className="card p-0 overflow-hidden shadow-sm">
        <div className="px-8 py-5 bg-[var(--bg-surface-2)] border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <Terminal className="h-4 w-4 text-[var(--color-primary)]" />
                 <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Stakeholder Identity Grid</h2>
            </div>
            <div className="flex items-center gap-4">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{loading ? 'Synchronizing Intelligence...' : `Active Units: ${clients.length}`}</span>
            </div>
        </div>

        {loading ? (
             <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
                  <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Executing Data Stream Query...</span>
             </div>
        ) : clients.length === 0 ? (
          <div className="p-32 text-center flex flex-col items-center opacity-30">
            <Globe className="h-20 w-20 text-[var(--text-muted)] mb-6 stroke-[1px]" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Zero Stakeholder Trace</h3>
            <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">No client accounts detected within current sector synchronization.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
                  {["Engagement Entity", "Organization", "Mission Scope", "Auth Protocol", "Deliverables", "Status", "Deployment Controls"].map(h => (
                    <th key={h} className="text-left px-8 py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c: any) => {
                  const pending = (c.deliverables || []).filter((d: any) => d.status === "PENDING_REVIEW").length;
                  const total = (c.deliverables || []).length;
                  const st = c.is_active ? STATUS_STYLE.ACTIVE : STATUS_STYLE.INACTIVE;
                  return (
                    <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[3px] bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-[10px] font-black shadow-lg transition-transform group-hover:scale-110">
                            {c.client?.name?.[0] || "C"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-tight group-hover:text-[var(--color-primary)] transition-colors">{c.client?.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-tighter lowercase">{c.client?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{c.company_name}</td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-xs text-[var(--text-primary)] uppercase tracking-tight">{c.project_name}</p>
                        {c.description && <p className="text-[10px] font-bold text-slate-300 mt-0.5 truncate max-w-[160px] uppercase">{c.description}</p>}
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-2 py-0.5 text-[9px] font-extrabold border border-blue-100 bg-blue-50 text-[var(--color-primary)] rounded-[2px] uppercase tracking-widest shadow-sm">
                            {c.access_type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                              <span className="text-[10px] font-black text-[var(--text-primary)] tabular-nums">{total} TOTAL</span>
                              {pending > 0 && <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest animate-pulse">{pending} PENDING</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn("px-2.5 py-1 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm", st.bg, st.text, st.border)}>
                          {c.is_active ? "OPERATIONAL" : "DECOMMISSIONED"}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDeliverableModal(c)}
                            className="bg-white border border-[var(--border)] text-[9px] font-black uppercase tracking-widest py-1.5 px-3 rounded-[2px] text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-blue-50 transition-all shadow-sm">
                            + Deliverable
                          </button>
                          <button onClick={() => setMilestoneModal(c)}
                            className="bg-white border border-[var(--border)] text-[9px] font-black uppercase tracking-widest py-1.5 px-3 rounded-[2px] text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm">
                            + Milestone
                          </button>
                          <button onClick={() => toggleAccess(c.id, c.is_active)}
                            className={cn(
                                "p-2 rounded-[2px] border transition-all shadow-sm",
                                c.is_active ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-300"
                            )}>
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

      {/* Modals Section */}
      
      {/* Initialization Modal */}
      {addClientOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-8 py-6 bg-[var(--bg-surface-2)] border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                  <Plus className="h-4 w-4 text-[var(--color-primary)]" /> Add Stakeholder Entity
              </h2>
              <button onClick={() => { setAddClientOpen(false); setError(""); }} className="p-1.5 rounded-[3px] hover:bg-white border border-transparent transition-all">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddClient} className="p-10 space-y-8">
              {error && <div className="p-4 bg-red-50 border border-red-100 rounded-[3px] flex items-center gap-4 animate-in shake-in">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">{error}</p>
              </div>}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>Stakeholder Name *</label>
                  <input required value={clientForm.name} placeholder="ENTITY_HUMAN_IDENTIFIER" onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))}
                    className={cn(inputClass, "uppercase")} />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Corporate Group *</label>
                  <input required value={clientForm.company_name} placeholder="ORGANIZATION_ALPHA" onChange={e => setClientForm(f => ({ ...f, company_name: e.target.value }))}
                    className={cn(inputClass, "uppercase")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>Communication Gmail *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input required type="email" value={clientForm.email} placeholder="CLIENT@GMAIL.COM" onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))}
                      className={cn(inputClass, "pl-10 lowercase")} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Tactical Phine Link</label>
                  <input value={clientForm.phone} placeholder="+X XXX-XXXX" onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))}
                    className={inputClass} />
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-slate-50">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Mission Designation (Project) *</label>
                    <input required value={clientForm.project_name} placeholder="PROJECT_CODENAME_EPSILON" onChange={e => setClientForm(f => ({ ...f, project_name: e.target.value }))}
                      className={cn(inputClass, "uppercase")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Mission Brief (Description)</label>
                    <textarea rows={2} value={clientForm.description} placeholder="Provide tactical overview of engagement scope..." onChange={e => setClientForm(f => ({ ...f, description: e.target.value }))}
                      className={cn(inputClass, "resize-none font-medium normal-case")} />
                  </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Authorization Level</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
                  <select value={clientForm.access_type} onChange={e => setClientForm(f => ({ ...f, access_type: e.target.value }))}
                    className={cn(inputClass, "pl-11 appearance-none bg-slate-50")}>
                    {ACCESS_TYPES.map(a => <option key={a} value={a}>{a}_PROTOCOL</option>)}
                  </select>
                   <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90" />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-[3px] border-l-4 border-l-blue-500">
                <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase tracking-widest">
                  System will finalize encryption keys and transmit credentials to entity mailbox.
                </p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button type="submit" disabled={saving}
                  className="jira-button jira-button-primary h-12 flex-1 gap-3 font-bold uppercase text-[10px] shadow-lg shadow-blue-100 disabled:opacity-50">
                  {saving ? "SAVING..." : "Save Client"}
                </button>
                <button type="button" onClick={() => { setAddClientOpen(false); setError(""); }}
                  className="jira-button border border-[var(--border)] h-12 flex-1 bg-white text-[var(--text-muted)] font-bold uppercase text-[10px]">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deliverable Modal */}
      {deliverableModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 bg-[var(--bg-surface-2)] border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                  <FileText className="h-4 w-4 text-[var(--color-primary)]" /> Append Deliverable
              </h2>
              <button onClick={() => { setDeliverableModal(null); setError(""); }}><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddDeliverable} className="p-10 space-y-6">
              <div className="p-4 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Mission</p>
                   <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase">{deliverableModal.project_name}</p>
              </div>

              <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Deliverable Designation *</label>
                    <input required value={deliverableForm.title} placeholder="ASSET_IDENTIFIER" onChange={e => setDeliverableForm(f => ({ ...f, title: e.target.value }))}
                      className={cn(inputClass, "uppercase")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Technical Brief</label>
                    <textarea rows={3} value={deliverableForm.description} placeholder="Provide technical documentation summary..." onChange={e => setDeliverableForm(f => ({ ...f, description: e.target.value }))}
                      className={cn(inputClass, "resize-none font-medium normal-case")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Revision Version</label>
                    <input type="number" min="1" value={deliverableForm.version} onChange={e => setDeliverableForm(f => ({ ...f, version: e.target.value }))}
                      className={inputClass} />
                  </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button type="submit" disabled={saving}
                  className="jira-button jira-button-primary h-12 flex-1 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">
                  Broadcast Asset
                </button>
                <button type="button" onClick={() => { setDeliverableModal(null); setError(""); }}
                  className="jira-button border border-[var(--border)] h-12 flex-1 bg-white text-[var(--text-muted)] font-bold uppercase text-[10px]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {milestoneModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-md overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 bg-[var(--bg-surface-2)] border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                  <Target className="h-4 w-4 text-indigo-500" /> Synchronize Milestone
              </h2>
              <button onClick={() => { setMilestoneModal(null); setError(""); }}><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddMilestone} className="p-10 space-y-6">
              <div className="p-4 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Mission</p>
                   <p className="text-[11px] font-bold text-[var(--text-primary)] uppercase">{milestoneModal.project_name}</p>
              </div>

              <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Milestone Objective *</label>
                    <input required value={milestoneForm.title} placeholder="CORE_PHASE_IDENTIFIER" onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                      className={cn(inputClass, "uppercase")} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Mission Logic</label>
                    <textarea rows={2} value={milestoneForm.description} placeholder="Define successful completion parameters..." onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
                      className={cn(inputClass, "resize-none font-medium normal-case")} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Termination Date</label>
                      <input type="date" value={milestoneForm.due_date} onChange={e => setMilestoneForm(f => ({ ...f, due_date: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Active State</label>
                      <div className="relative">
                          <select value={milestoneForm.status} onChange={e => setMilestoneForm(f => ({ ...f, status: e.target.value }))}
                            className={cn(inputClass, "appearance-none bg-slate-50")}>
                            <option value="NOT_STARTED">STDBY</option>
                            <option value="IN_PROGRESS">ACTIVE</option>
                            <option value="COMPLETED">CMB</option>
                          </select>
                          <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 rotate-90" />
                      </div>
                    </div>
                  </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-50">
                <button type="submit" disabled={saving}
                  className="jira-button bg-indigo-600 text-white hover:bg-indigo-700 h-12 flex-1 font-bold uppercase text-[10px] shadow-lg shadow-indigo-100">
                  Lock Milestone
                </button>
                <button type="button" onClick={() => { setMilestoneModal(null); setError(""); }}
                  className="jira-button border border-[var(--border)] h-12 flex-1 bg-white text-[var(--text-muted)] font-bold uppercase text-[10px]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
