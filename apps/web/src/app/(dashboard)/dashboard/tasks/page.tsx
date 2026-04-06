"use client";

import { useEffect, useState } from "react";
import { 
    CheckSquare, Search, Clock, ArrowLeft, ExternalLink, 
    AlertCircle, LayoutGrid, List, Filter, Plus, ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TaskBoard from "@/components/team-tasks/task-board";
import { cn } from "@/lib/utils";

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
    DONE: "bg-green-100 text-green-700",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function TasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [view, setView] = useState<"board" | "list">("board");
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
    
    const overdueCount = filtered.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== "COMPLETED" && t.status !== "DONE").length;

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header Area */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Tasks</h1>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Tracking {tasks.length} tasks across {new Set(tasks.map(t => t.team_id)).size} projects
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                         <div className="flex items-center bg-[var(--bg-surface-2)] p-1 rounded-[3px] border border-[var(--border)]">
                            <button 
                                onClick={() => setView("board")}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[3px] transition-all",
                                    view === "board" ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                )}
                            >
                                <LayoutGrid className="h-4 w-4" /> Board
                            </button>
                            <button 
                                onClick={() => setView("list")}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[3px] transition-all",
                                    view === "list" ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                )}
                            >
                                <List className="h-4 w-4" /> List
                            </button>
                        </div>
                        <button className="jira-button jira-button-primary gap-2">
                             <Plus className="h-4 w-4" /> Create
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-4 flex-wrap pb-2">
                    <div className="relative min-w-[240px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <input 
                            placeholder="Search tasks..." 
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border)] rounded-[3px] text-sm focus:border-[var(--color-primary)] transition-all outline-none"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <select 
                            value={filterStatus} 
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-white border border-[var(--border)] rounded-[3px] px-3 py-2 text-sm text-[var(--text-secondary)] font-medium outline-none hover:bg-[var(--bg-surface-2)] transition-colors"
                        >
                            <option value="">Status: All</option>
                            {["TODO","IN_PROGRESS","REVIEW","DONE"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                        </select>
                        
                        {overdueCount > 0 && (
                            <span className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-[3px] border border-red-100">
                                <AlertCircle className="h-3.5 w-3.5" /> {overdueCount} Overdue
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-[3px] text-sm text-red-600 bg-red-50 border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                    <button onClick={loadTasks} className="ml-auto text-xs font-bold underline">Retry</button>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="card p-20 text-center flex flex-col items-center">
                        <CheckSquare className="h-12 w-12 text-[var(--border)] mb-4" />
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">All clear!</h3>
                        <p className="text-[var(--text-secondary)] mt-1 max-w-xs">
                            {tasks.length === 0 ? "You don't have any tasks assigned yet." : "No tasks match your current filters."}
                        </p>
                    </div>
                ) : view === "board" ? (
                    <TaskBoard 
                        tasks={filtered} 
                        onTaskClick={(t) => router.push(`/dashboard/teams/${t.team_id}`)}
                        isLeader={false}
                        onStatusChange={() => {}}
                    />
                ) : (
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)] bg-[var(--bg-surface-2)]">
                                        <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Type</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Summary</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Project</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Status</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Priority</th>
                                        <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Due</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(task => {
                                        const isOverdue = task.due_date && new Date(task.due_date) < now && task.status !== "COMPLETED" && task.status !== "DONE";
                                        return (
                                            <tr key={task.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-surface-2)] cursor-pointer transition-colors"
                                                onClick={() => router.push(`/dashboard/teams/${task.team_id}`)}>
                                                <td className="px-5 py-3.5 italic text-[var(--text-muted)]">Task</td>
                                                <td className="px-5 py-3.5">
                                                    <p className="font-bold text-[var(--text-primary)]">{task.title}</p>
                                                    {task.description && <p className="text-xs text-[var(--text-secondary)] truncate max-w-md mt-0.5">{task.description}</p>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-xs font-bold text-[var(--color-primary)]">{task.team_name}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                                        statusColors[task.status] || statusColors.TODO
                                                    )}>
                                                        {task.status?.replace("_"," ") || "TODO"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                                        priorityColors[task.priority] || priorityColors.LOW
                                                    )}>
                                                        {task.priority || "LOW"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className={cn(
                                                        "flex items-center gap-1.5 text-xs",
                                                        isOverdue ? "text-red-500 font-bold" : "text-[var(--text-secondary)]"
                                                    )}>
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "\u2014"}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}