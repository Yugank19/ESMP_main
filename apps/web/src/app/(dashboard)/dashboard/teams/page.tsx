"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Users, Plus, ArrowRight, Lock, Globe, Crown, LogIn, 
    MoreHorizontal, LayoutGrid, Search, Settings, 
    ShieldCheck, UserPlus, ExternalLink
} from 'lucide-react';
import { teamsApi } from '@/lib/teams-api';
import CreateTeamModal from '@/components/teams/create-team-modal';
import JoinTeamModal from '@/components/teams/join-team-modal';
import { cn } from '@/lib/utils';

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const res = await teamsApi.getMyTeams();
            setTeams(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
        load();
    }, []);

    const getMyRole = (team: any) => {
        const stored = localStorage.getItem('user');
        if (!stored) return 'MEMBER';
        const u = JSON.parse(stored);
        return team.members?.find((m: any) => m.user_id === u.id)?.role || 'MEMBER';
    };

    const filteredTeams = teams.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Teams & Workspaces</h1>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            Collaborate across projects and manage your team resources
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button 
                            onClick={() => setShowJoin(true)}
                            className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] gap-2 font-bold uppercase text-[9px] sm:text-[10px] h-9"
                        >
                            <UserPlus className="h-4 w-4" /> Join Team
                        </button>
                        <button 
                            onClick={() => setShowCreate(true)}
                            className="jira-button jira-button-primary gap-2 font-bold uppercase text-[9px] sm:text-[10px] h-9"
                        >
                            <Plus className="h-4 w-4" /> Create Team
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-[var(--border)] pb-4">
                    <div className="relative w-full md:min-w-[320px] md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <input 
                            placeholder="Filter teams..." 
                            value={searchQuery} 
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border)] rounded-[3px] text-sm focus:border-[var(--color-primary)] transition-all outline-none font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <button className="flex items-center shrink-0 gap-2 px-3 py-2 text-xs font-bold text-[var(--color-primary)] bg-[var(--bg-surface-2)] rounded-[3px]">
                           <LayoutGrid className="h-4 w-4" /> All Teams
                        </button>
                        <button className="flex items-center shrink-0 gap-2 px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                           <Crown className="h-4 w-4" /> Managed by me
                        </button>
                    </div>
                </div>
            </div>

            {/* Teams Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="card h-52 animate-pulse bg-slate-50" />
                    ))}
                </div>
            ) : filteredTeams.length === 0 ? (
                <div className="card p-24 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[3px] bg-blue-50 flex items-center justify-center mb-6">
                        <Users className="h-8 w-8 text-[var(--color-primary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Ready to collaborate?</h3>
                    <p className="text-[var(--text-secondary)] mt-2 max-w-sm">
                        {searchQuery ? "No teams found matching your filter." : "You're not part of any teams yet. Create a team to start managing tasks and files."}
                    </p>
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setShowCreate(true)} className="jira-button jira-button-primary">Create Team</button>
                        <button onClick={() => setShowJoin(true)} className="jira-button bg-white border border-[var(--border)] text-[var(--text-secondary)]">Join with Code</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.map(team => {
                        const myRole = getMyRole(team);
                        const isLeader = myRole === 'LEADER';
                        return (
                            <div key={team.id}
                                className="card group hover:border-[var(--color-primary)] transition-all cursor-pointer flex flex-col pt-6"
                                onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                                
                                <div className="px-6 flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-[3px] bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
                                        {team.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        {isLeader && (
                                            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-[3px] bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-tighter">
                                                <Crown className="h-3 w-3" /> Team Leader
                                            </span>
                                        )}
                                        <span className={cn(
                                            "flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-[3px] uppercase tracking-tighter border",
                                            team.visibility === 'PUBLIC' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                                        )}>
                                            {team.visibility === 'PUBLIC' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                            {team.visibility}
                                        </span>
                                    </div>
                                </div>

                                <div className="px-6 flex-1">
                                    <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">
                                        {team.name}
                                    </h3>
                                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-2 leading-relaxed min-h-[32px]">
                                        {team.description || team.purpose || 'Dynamic enterprise workspace for agile collaboration.'}
                                    </p>
                                </div>

                                <div className="mt-6 px-6 py-4 flex items-center justify-between bg-slate-50 border-t border-[var(--border)] group-hover:bg-white transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                            <Users className="h-3.5 w-3.5" />
                                            <span>{team._count?.members || team.members?.length || 0} Members</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            <span>Active</span>
                                        </div>
                                    </div>
                                    <div className="h-8 w-8 rounded-[3px] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--color-primary)] group-hover:bg-blue-50 transition-all">
                                        <ExternalLink className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showCreate && (
                <CreateTeamModal
                    onClose={() => setShowCreate(false)}
                    onCreated={(team) => { setTeams(p => [team, ...p]); setShowCreate(false); router.push(`/dashboard/teams/${team.id}`); }}
                />
            )}
            {showJoin && (
                <JoinTeamModal
                    onClose={() => setShowJoin(false)}
                    onJoined={() => { load(); setShowJoin(false); }}
                />
            )}
        </div>
    );
}
