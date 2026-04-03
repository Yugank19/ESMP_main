"use client";

import { useEffect, useState } from "react";
import { Briefcase, Search, Calendar, Users, ArrowUpRight, ArrowLeft, AlertCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ProjectsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) { router.push("/login"); return; }
        loadTeams();
    }, []);

    async function loadTeams() {
        setLoading(true); setError("");
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/teams`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            setTeams(Array.isArray(data) ? data : []);
        } catch { setError("Failed to load projects. Please try again."); }
        finally { setLoading(false); }
    }

    const filtered = teams.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()));

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
                        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Projects</h1>
                        <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Your team workspaces and projects</p>
                    </div>
                </div>
                <Link href="/dashboard/teams" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
                    <Plus className="h-4 w-4" /> New Team / Project
                </Link>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm text-red-600 bg-red-50 border border-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />{error}
                    <button onClick={loadTeams} className="ml-auto text-xs font-semibold underline">Retry</button>
                </div>
            )}

            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--bg-surface)", color: "var(--text-primary)" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "var(--primary)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")} />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border p-16 text-center" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                    <Briefcase className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                    <p className="font-medium" style={{ color: "var(--text-primary)" }}>{teams.length === 0 ? "No projects yet" : "No projects match your search"}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{teams.length === 0 ? "Create a team to start your first project." : "Try a different search term."}</p>
                    {teams.length === 0 && (
                        <Link href="/dashboard/teams" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold" style={{ color: "var(--primary)" }}>
                            Create a Team <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(team => (
                        <Link key={team.id} href={`/dashboard/teams/${team.id}`}
                            className="group rounded-xl border p-5 transition-all hover:-translate-y-1 block"
                            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}>
                            <div className="flex items-start justify-between mb-3">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${team.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                                    {team.status || "ACTIVE"}
                                </span>
                                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--primary)" }} />
                            </div>
                            <h3 className="text-sm font-semibold mb-1 group-hover:text-[var(--primary)] transition-colors" style={{ color: "var(--text-primary)" }}>
                                {team.name}
                            </h3>
                            <p className="text-xs line-clamp-2 mb-4" style={{ color: "var(--text-secondary)" }}>
                                {team.description || team.purpose || "No description provided."}
                            </p>
                            <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{team._count?.members || team.members?.length || 0} members</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{new Date(team.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}