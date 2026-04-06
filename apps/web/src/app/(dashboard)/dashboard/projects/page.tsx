"use client";

import { useEffect, useState, useCallback } from "react";
import { 
    Briefcase, Search, Calendar, Users, ArrowUpRight, 
    ArrowLeft, AlertCircle, Plus, Layout, Zap, 
    Target, Flag, MoreHorizontal, Terminal
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ProjectsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const loadTeams = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API}/teams`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("DATA_STREAM_FAILURE");
            const data = await res.json();
            setTeams(Array.isArray(data) ? data : []);
        } catch { setError("PROTOCOL_ERROR: FAILED TO SYNCHRONIZE PROJECT DATA."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) { router.push("/login"); return; }
        loadTeams();
    }, [loadTeams, router]);

    const filtered = teams.filter(t => t.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col space-y-8 animate-in fade-in duration-300 pb-12">
            {/* Header Section */}
            <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()}
                        className="p-2.5 rounded-[3px] bg-white border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Project Intelligence Repository</h1>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Active mission parameters and cross-sector team workspaces</p>
                    </div>
                </div>
                <Link href="/dashboard/teams" 
                    className="jira-button jira-button-primary h-12 px-8 gap-3 font-bold uppercase text-[10px] shadow-lg shadow-blue-100 flex items-center">
                    <Plus className="h-4 w-4" /> Initialize Mission
                </Link>
            </div>

            {/* Status Feedback */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-[3px] flex items-center gap-4 animate-in shake-in">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-widest flex-1">{error}</p>
                    <button onClick={loadTeams} className="text-[10px] font-black underline uppercase text-red-700 hover:text-red-900 transition-colors">Retry Sync</button>
                </div>
            )}

            {/* Tactical Search Interface */}
            <div className="relative w-full max-w-xl group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[var(--color-primary)] transition-colors" />
                <input placeholder="SEARCH MISSION CODENAMES, OBJECTIVES, OR SECTORS..." value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white border border-[var(--border)] rounded-[3px] text-[11px] font-bold uppercase tracking-[0.2em] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] shadow-sm transition-all" />
            </div>

            {/* Project Intelligence Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-64 bg-slate-50 border border-slate-100 rounded-[3px] animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="card p-32 text-center flex flex-col items-center border-[var(--border)] opacity-30 shadow-sm">
                    <Briefcase className="h-20 w-20 text-[var(--text-muted)] mb-6 stroke-[1px]" />
                    <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Registry Vacant</h3>
                    <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">No project entities detected within current sector parameters.</p>
                    {teams.length === 0 && (
                        <Link href="/dashboard/teams" className="mt-8 flex items-center gap-2 text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest hover:translate-x-2 transition-transform">
                            Initialize First Project Sector <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(team => (
                        <Link key={team.id} href={`/dashboard/teams/${team.id}`}
                            className="group card p-0 overflow-hidden border-[var(--border)] hover:border-[var(--color-primary)] hover:shadow-xl transition-all duration-300 relative flex flex-col">
                            
                            {/* Card Accent */}
                            <div className="h-1.5 w-full bg-slate-100 group-hover:bg-[var(--color-primary)] transition-colors" />
                            
                            <div className="p-8 flex-1 flex flex-col">
                                <div className="flex items-start justify-between mb-6">
                                     <div className={cn(
                                         "px-2.5 py-1 text-[9px] font-extrabold border rounded-[2px] uppercase tracking-widest shadow-sm transition-all",
                                         team.status === "ACTIVE" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-500"
                                     )}>
                                         {team.status || "OPERATIONAL_READY"}
                                     </div>
                                     <div className="w-8 h-8 rounded-[3px] bg-slate-50 border border-slate-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 translate-x-4">
                                         <ArrowUpRight className="h-4 w-4 text-[var(--color-primary)]" />
                                     </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight group-hover:text-[var(--color-primary)] transition-colors leading-tight">
                                        {team.name}
                                    </h3>
                                    <p className="text-[11px] font-medium text-[var(--text-secondary)] line-clamp-3 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
                                        {team.description || team.purpose || "No descriptive intelligence provided for this mission sector."}
                                    </p>
                                </div>

                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 group/meta">
                                            <Users className="h-3.5 w-3.5 text-slate-300 group-hover/meta:text-[var(--color-primary)] transition-colors" />
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase">{team._count?.members || team.members?.length || 0} UNITS</span>
                                        </div>
                                        <div className="flex items-center gap-2 group/meta">
                                            <Calendar className="h-3.5 w-3.5 text-slate-300 group-hover/meta:text-[var(--color-primary)] transition-colors" />
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase">{new Date(team.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <Zap className="h-4 w-4 text-slate-100 group-hover:text-blue-100 transition-colors" />
                                </div>
                            </div>

                            {/* Background Protocol Subtle ID */}
                            <div className="absolute -bottom-2 -right-2 text-[40px] font-black text-slate-50/50 pointer-events-none group-hover:text-blue-50/20 transition-colors uppercase select-none">
                                {team.name?.substring(0, 3)}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Tactical Heuristic Legend */}
            <div className="flex items-center gap-6 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ACTIVE_MISSION</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300 shadow-sm shadow-slate-100" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STDBY_DISENGAGED</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <Terminal className="h-3.5 w-3.5 text-slate-200" />
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">PROTOCOL: DIRECT_AUTH_SYNC</span>
                </div>
            </div>
        </div>
    );
}