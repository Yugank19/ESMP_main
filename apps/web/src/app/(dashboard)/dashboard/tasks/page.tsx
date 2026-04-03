"use client";

import { useEffect, useState } from "react";
import { CheckSquare, Search, Clock, ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const priorityColors: Record<string, string> = {
    URGENT: "bg-red-100 text-red-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-slate-100 text-slate-600",
};
const statusColors: Record<string, string> = {
    TODO: "bg-slate-100 text-slate-600",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    REVIEW: "bg-purple-100 text-purple-700",
    COMPLETED: "bg-green-100 text-green-700",
};
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) { router.push("/login"); return; }
        loadTasks();
    }, []);

    async function loadTasks() {
        setLoading(true); setError("");
        try {
            const token = localStorage.getItem("token");
            const teamsRes = await fetch(`${API}/teams`, { headers: { Authorization: `Bearer ${token}` } });
            if (!teamsRes.ok) throw new Error("Failed to load teams");
            const teams = await teamsRes.json();
            if (!Array.isArray(teams) || teams.length === 0) { setTasks([]); setLoading(false); return; }
            const allArrays = await Promise.all(teams.map(async (team: any) => {
                try {
                    const res = await fetch(`${API}/team-tasks/${team.id}`, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) return [];
                    const data = await res.json();
                    return Array.isArray(data) ? data.map((t: any) => ({ ...t, team_name: team.name, team_id: team.id })) : [];
                } catch { return []; }
            }));
            const all = allArrays.flat().sort((a, b) => {
                if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                if (a.due_date) return -1; if (b.due_date) return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setTasks(all);
        } catch { setError("Failed to load tasks. Please try again."); }
        finally { setLoading(false); }
    }

    const now = new Date();
    const filtered = tasks.filter(t => {
        const ms = !search || t.title?.toLowerCase().includes(search.toLowerCase());
        const mst = !filterStatus || t.status === filterStatus;
        return ms && mst;
    });
    const overdue = filtered.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "COMPLETED").length;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        style={{ color: "var(--text-secondary)", background: "var(--bg-surface-2)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-surface-3)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-surface-2)")}>
                        <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>My Tasks</h1>
                        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                            All tasks across your teams{overdue > 0 && <span className="ml-2 text-red-500 font-semibold">· {overdue} overdue</span>}
                        </p>
                    </div>
                </div>
                <Link href="/dashboard/teams" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
                    <ExternalLink className="h-4 w-4" /> Manage in Teams
                </Link>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-red-600 bg-red-50 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                    <button onClick={loadTasks} className="ml-auto text-xs font-semibold underline">Retry</button>
                </div>
            )}

            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                    <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none"
                        style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
                        onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)" }}>
                    <option value="">All Statuses</option>
                    {["TODO","IN_PROGRESS","REVIEW","COMPLETED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                </select>
            </div>

            <div className="rounded-xl overflow-hidden border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface-2)" }}>
                            {["Task","Team","Priority","Status","Assignees","Due Date"].map(h => (
                                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? [1,2,3,4].map(i => (
                            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td colSpan={6} className="px-5 py-4"><div className="skeleton h-4 rounded" /></td>
                            </tr>
                        )) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="px-5 py-16 text-center">
                                <CheckSquare className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                                <p className="font-medium" style={{ color: "var(--text-primary)" }}>{tasks.length === 0 ? "No tasks yet" : "No tasks match filters"}</p>
                                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{tasks.length === 0 ? "Join a team to see tasks assigned to you." : "Try adjusting your search."}</p>
                                {tasks.length === 0 && <Link href="/dashboard/teams" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold" style={{ color: "var(--primary)" }}>Browse Teams <ExternalLink className="h-3.5 w-3.5" /></Link>}
                            </td></tr>
                        ) : filtered.map(task => {
                            const isOverdue = task.due_date && new Date(task.due_date) < now && task.status !== "COMPLETED";
                            return (
                                <tr key={task.id} className="cursor-pointer transition-colors" style={{ borderBottom: "1px solid var(--border)" }}
                                    onClick={() => router.push(`/dashboard/teams/${task.team_id}`)}
                                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-surface-2)")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "")}>
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                                        {task.description && <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--text-muted)" }}>{task.description}</p>}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{task.team_name}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColors[task.priority] || priorityColors.LOW}`}>{task.priority || "LOW"}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[task.status] || statusColors.TODO}`}>{task.status?.replace("_"," ") || "TODO"}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex -space-x-1">
                                            {(task.assignees || []).slice(0,3).map((a: any) => (
                                                <div key={a.user?.id || a.id} title={a.user?.name} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold" style={{ background: "#2563eb" }}>
                                                    {a.user?.name?.[0] || "?"}
                                                </div>
                                            ))}
                                            {(task.assignees || []).length === 0 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Unassigned</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-500 font-semibold" : ""}`} style={{ color: isOverdue ? undefined : "var(--text-muted)" }}>
                                            <Clock className="h-3.5 w-3.5" />
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}
                                            {isOverdue && " (Overdue)"}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {!loading && filtered.length > 0 && (
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    {filtered.length} of {tasks.length} tasks · Click any row to open in team workspace
                </p>
            )}
        </div>
    );
}