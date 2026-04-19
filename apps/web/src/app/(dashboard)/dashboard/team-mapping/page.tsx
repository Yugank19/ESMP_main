"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Building2, FolderOpen, ArrowRight, CheckCircle, Clock,
  AlertCircle, X, ChevronDown, Search, RefreshCw, Link2, Link2Off,
  BarChart2, Activity, ArrowLeft, Zap, Target
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const tok = () => typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers || {}) },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || "Request failed");
  return d;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  ACTIVE:    { bg: "#ecfdf5", color: "#059669", label: "Active" },
  ON_HOLD:   { bg: "#fffbeb", color: "#d97706", label: "On Hold" },
  COMPLETED: { bg: "#eff6ff", color: "#2563eb", label: "Completed" },
};

export default function TeamMappingPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [assignModal, setAssignModal] = useState<any>(null); // { project }
  const [selectedTeam, setSelectedTeam] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiFetch("/teams/manager/mapping"); setData(d); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.replace("/login"); return; }
    const u = JSON.parse(stored);
    const role = (u.roles?.[0] || "").toUpperCase();
    if (!["MANAGER", "ADMIN"].includes(role)) { router.replace("/dashboard"); return; }
    load();
  }, [load, router]);

  async function handleAssign(projectId: string, teamId: string | null) {
    setAssigning(true); setError("");
    try {
      await apiFetch("/teams/manager/assign-project", {
        method: "PATCH",
        body: JSON.stringify({ projectId, teamId }),
      });
      setAssignModal(null);
      setSelectedTeam("");
      setSuccess(teamId ? "Project assigned to team successfully" : "Project unassigned from team");
      setTimeout(() => setSuccess(""), 3000);
      load();
    } catch (e: any) { setError(e.message); }
    setAssigning(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  const teams = data?.teams || [];
  const unassigned = data?.unassignedProjects || [];
  const stats = data?.stats || {};

  const filteredTeams = teams.filter((t: any) =>
    !search.trim() || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="p-2.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Team & Client Mapping</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Assign client projects to teams and monitor progress</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          <CheckCircle className="h-4 w-4" /> {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Teams", value: stats.totalTeams || 0, icon: Users, color: "#2563eb", bg: "#eff6ff" },
          { label: "Assigned Projects", value: stats.totalAssigned || 0, icon: Link2, color: "#059669", bg: "#ecfdf5" },
          { label: "Unassigned Projects", value: stats.totalUnassigned || 0, icon: AlertCircle, color: "#d97706", bg: "#fffbeb" },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unassigned projects banner */}
      {unassigned.length > 0 && (
        <div className="card p-5 border-l-4 border-amber-400">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                {unassigned.length} project{unassigned.length > 1 ? 's' : ''} not yet assigned to a team
              </h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-semibold text-amber-800">{p.project_name}</span>
                <span className="text-[10px] text-amber-500">({p.client?.name})</span>
                <button onClick={() => { setAssignModal(p); setSelectedTeam(""); setError(""); }}
                  className="ml-1 text-[10px] font-bold text-blue-600 hover:underline">Assign →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teams..."
          className="w-full pl-9 pr-3 py-2 border border-[var(--border)] rounded-xl text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
          style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }} />
      </div>

      {/* Team cards */}
      {filteredTeams.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="font-semibold text-[var(--text-secondary)]">No teams found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTeams.map((team: any) => {
            const taskStats = team.taskStats || { total: 0, todo: 0, inProgress: 0, done: 0 };
            const completionPct = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

            return (
              <div key={team.id} className="card overflow-hidden">
                {/* Team header */}
                <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}>
                      {team.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[var(--text-primary)]">{team.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {team._count?.members || 0} members
                        </span>
                      </div>
                      {team.description && <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{team.description}</p>}
                    </div>
                  </div>
                  <Link href={`/dashboard/teams/${team.id}`}
                    className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                    View workspace <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Task progress */}
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Task Progress</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-surface-2)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${completionPct}%`, background: "linear-gradient(90deg,#2563eb,#7c3aed)" }} />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-secondary)]">{completionPct}%</span>
                      </div>
                      <div className="flex gap-3 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />{taskStats.todo} todo</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{taskStats.inProgress} active</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{taskStats.done} done</span>
                      </div>
                    </div>

                    {/* Members preview */}
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Members</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {team.members?.slice(0, 6).map((m: any) => (
                          <div key={m.user_id} title={m.user?.name}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
                            style={{ background: m.role === 'LEADER' ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'linear-gradient(135deg,#64748b,#94a3b8)' }}>
                            {m.user?.avatar_url
                              ? <img src={m.user.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                              : m.user?.name?.[0] || 'U'}
                          </div>
                        ))}
                        {(team.members?.length || 0) > 6 && (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white"
                            style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>
                            +{team.members.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assigned client projects */}
                  {team.assignedProjects?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        Assigned Client Projects ({team.assignedProjects.length})
                      </p>
                      <div className="space-y-2">
                        {team.assignedProjects.map((p: any) => {
                          const ps = STATUS_COLORS[p.status] || STATUS_COLORS.ACTIVE;
                          const approved = (p.deliverables || []).filter((d: any) => d.status === 'APPROVED').length;
                          const total = (p.deliverables || []).length;
                          const mileDone = (p.milestones || []).filter((m: any) => m.status === 'COMPLETED').length;
                          const mileTotal = (p.milestones || []).length;

                          return (
                            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)]"
                              style={{ background: "var(--bg-surface-2)" }}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}>
                                {p.project_name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{p.project_name}</p>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: ps.bg, color: ps.color }}>{ps.label}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                    <Building2 className="h-3 w-3" /> {p.client?.name} · {p.client?.organization}
                                  </span>
                                </div>
                                <div className="flex gap-3 mt-1 text-[10px] text-[var(--text-muted)]">
                                  <span>{approved}/{total} deliverables approved</span>
                                  <span>{mileDone}/{mileTotal} milestones done</span>
                                </div>
                              </div>
                              <button onClick={() => { setAssignModal(p); setSelectedTeam(team.id); setError(""); }}
                                className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors" title="Reassign or unassign">
                                <Link2Off className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent activity */}
                  {team.activity?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Recent Activity</p>
                      <div className="space-y-1.5">
                        {team.activity.slice(0, 3).map((a: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            <span className="font-medium text-[var(--text-secondary)]">{a.user?.name}</span>
                            <span>{a.description}</span>
                            <span className="ml-auto shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "var(--bg-surface)" }}>
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">Assign to Team</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Project: <strong>{assignModal.project_name}</strong></p>
                <p className="text-xs text-[var(--text-muted)]">Client: {assignModal.client?.name}</p>
              </div>
              <button onClick={() => setAssignModal(null)}><X className="h-5 w-5 text-[var(--text-muted)]" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}
              <div>
                <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">Select Team</label>
                <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)] transition-colors"
                  style={{ background: "var(--bg-surface-2)", color: "var(--text-primary)" }}>
                  <option value="">— Unassign (remove from team) —</option>
                  {teams.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} ({t._count?.members || 0} members)</option>
                  ))}
                </select>
              </div>
              {selectedTeam && (
                <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-xs text-blue-700">
                  <p className="font-semibold">Assignment Preview:</p>
                  <p className="mt-1 flex items-center gap-2">
                    <span className="font-bold">{assignModal.client?.name}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-bold">{assignModal.project_name}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-bold">{teams.find((t: any) => t.id === selectedTeam)?.name}</span>
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleAssign(assignModal.id, selectedTeam || null)} disabled={assigning}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
                  style={{ background: "var(--color-primary)" }}>
                  {assigning ? "Saving..." : selectedTeam ? "Assign to Team" : "Remove Assignment"}
                </button>
                <button onClick={() => setAssignModal(null)}
                  className="px-4 py-2.5 rounded-xl text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
