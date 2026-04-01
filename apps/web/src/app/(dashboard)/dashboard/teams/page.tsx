"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, ArrowRight, Lock, Globe, Crown, LogIn } from 'lucide-react';
import { teamsApi } from '@/lib/teams-api';
import CreateTeamModal from '@/components/teams/create-team-modal';
import JoinTeamModal from '@/components/teams/join-team-modal';

export default function TeamsPage() {
    const router = useRouter();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [user, setUser] = useState<any>(null);

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

    return (
        <div className="space-y-5 ">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#0F172A]">Teams</h1>
                    <p className="text-sm text-[#64748B] mt-0.5">Manage your teams and workspaces</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowJoin(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-sm font-semibold rounded-lg transition">
                        <LogIn className="h-4 w-4" /> Join Team
                    </button>
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition">
                        <Plus className="h-4 w-4" /> New Team
                    </button>
                </div>
            </div>

            {/* Teams grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-44 bg-[#F1F5F9] rounded-xl animate-pulse" />)}
                </div>
            ) : teams.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                        <Users className="h-6 w-6 text-[#1D4ED8]" />
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A]">No teams yet</p>
                    <p className="text-xs text-[#64748B] mt-1 mb-4">Create a team or join one with an invite code.</p>
                    <button onClick={() => setShowCreate(true)}
                        className="px-4 py-2 bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg hover:bg-[#1E40AF] transition">
                        Create your first team
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map(team => {
                        const myRole = getMyRole(team);
                        const isLeader = myRole === 'LEADER';
                        return (
                            <div key={team.id}
                                className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md hover:border-[#1D4ED8]/30 transition-all group cursor-pointer"
                                onClick={() => router.push(`/dashboard/teams/${team.id}`)}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] font-bold text-sm shrink-0">
                                        {team.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {isLeader && (
                                            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                <Crown className="h-3 w-3" /> Leader
                                            </span>
                                        )}
                                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${team.visibility === 'PUBLIC' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {team.visibility === 'PUBLIC' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                            {team.visibility}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors mb-1">
                                    {team.name}
                                </h3>
                                <p className="text-xs text-[#64748B] line-clamp-2 mb-4 min-h-[2rem]">
                                    {team.description || team.purpose || 'No description provided.'}
                                </p>

                                <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                                    <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{team._count?.members || team.members?.length || 0} members</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-[#1D4ED8] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                        Open workspace <ArrowRight className="h-3.5 w-3.5" />
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
