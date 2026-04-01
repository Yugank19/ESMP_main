"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Users, Crown, Settings, Copy, Check, ArrowLeft,
    UserPlus, Trash2, Lock, Globe, RefreshCw, UserMinus,
    CheckSquare, Target, TrendingUp, LayoutDashboard, Plus,
    Search, Clock, MessageSquare, FolderOpen, Megaphone, BookOpen, Activity
} from 'lucide-react';
import { teamsApi } from '@/lib/teams-api';
import { teamTasksApi } from '@/lib/team-tasks-api';
import InviteMemberModal from '@/components/teams/invite-member-modal';
import EditTeamModal from '@/components/teams/edit-team-modal';
import TaskBoard from '@/components/team-tasks/task-board';
import TaskDetailModal from '@/components/team-tasks/task-detail-modal';
import CreateTaskModal from '@/components/team-tasks/create-task-modal';
import MilestonesView from '@/components/team-tasks/milestones-view';
import ProgressView from '@/components/team-tasks/progress-view';
import ProjectDashboard from '@/components/team-tasks/project-dashboard';
import TeamChat from '@/components/team-collab/team-chat';
import FileManager from '@/components/team-collab/file-manager';
import Announcements from '@/components/team-collab/announcements';
import MeetingNotes from '@/components/team-collab/meeting-notes';
import ActivityFeed from '@/components/team-collab/activity-feed';

const ROLE_COLORS: Record<string, string> = {
    LEADER: 'bg-amber-100 text-amber-700',
    MEMBER: 'bg-blue-100 text-blue-700',
    REVIEWER: 'bg-purple-100 text-purple-700',
    VIEWER: 'bg-slate-100 text-slate-600',
};

type Tab = 'dashboard' | 'tasks' | 'milestones' | 'progress' | 'chat' | 'files' | 'announcements' | 'meetings' | 'members' | 'activity' | 'settings';

export default function TeamWorkspacePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [team, setTeam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    // Phase 3 state
    const [tasks, setTasks] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [taskFilter, setTaskFilter] = useState({ status: '', priority: '', search: '' });

    // Modals
    const [showInvite, setShowInvite] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadTeam = useCallback(async () => {
        try {
            const res = await teamsApi.getTeam(id);
            setTeam(res.data);
        } catch (e: any) {
            if (e.response?.status === 403) router.push('/dashboard/teams');
        } finally { setLoading(false); }
    }, [id, router]);

    const loadTasks = useCallback(async () => {
        try {
            const params: Record<string, string> = {};
            if (taskFilter.status) params.status = taskFilter.status;
            if (taskFilter.priority) params.priority = taskFilter.priority;
            if (taskFilter.search) params.search = taskFilter.search;
            const res = await teamTasksApi.getTasks(id, params);
            setTasks(res.data);
        } catch { /* ignore */ }
    }, [id, taskFilter]);

    const loadMilestones = useCallback(async () => {
        try {
            const res = await teamTasksApi.getMilestones(id);
            setMilestones(res.data);
        } catch { /* ignore */ }
    }, [id]);

    const loadProgress = useCallback(async () => {
        try {
            const res = await teamTasksApi.getProgress(id);
            setProgressUpdates(res.data);
        } catch { /* ignore */ }
    }, [id]);

    const loadStats = useCallback(async () => {
        try {
            const res = await teamTasksApi.getStats(id);
            setStats(res.data);
        } catch { /* ignore */ }
    }, [id]);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored));
        loadTeam();
    }, [loadTeam]);

    useEffect(() => {
        if (!team) return;
        loadTasks();
        loadMilestones();
        loadProgress();
        loadStats();
    }, [team, loadTasks, loadMilestones, loadProgress, loadStats]);

    useEffect(() => {
        if (team) loadTasks();
    }, [taskFilter, loadTasks]);

    const myMembership = team?.members?.find((m: any) => m.user_id === currentUser?.id);
    const isLeader = myMembership?.role === 'LEADER';
    const activeMembers = team?.members?.filter((m: any) => m.status === 'ACTIVE') || [];

    const copyCode = () => {
        navigator.clipboard.writeText(team.invite_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Remove this member from the team?')) return;
        setActionLoading(memberId);
        try {
            await teamsApi.removeMember(id, memberId);
            setTeam((t: any) => ({ ...t, members: t.members.filter((m: any) => m.user_id !== memberId) }));
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
        finally { setActionLoading(null); }
    };

    const handleRoleChange = async (memberId: string, role: string) => {
        setActionLoading(memberId + role);
        try {
            await teamsApi.updateMemberRole(id, memberId, role);
            setTeam((t: any) => ({
                ...t,
                members: t.members.map((m: any) => m.user_id === memberId ? { ...m, role } : m),
            }));
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
        finally { setActionLoading(null); }
    };

    const handleRegenCode = async () => {
        if (!confirm('Regenerate invite code? The old code will stop working.')) return;
        try {
            const res = await teamsApi.regenerateCode(id);
            setTeam((t: any) => ({ ...t, invite_code: res.data.invite_code }));
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    };

    const handleArchive = async () => {
        if (!confirm('Archive this team? Members will lose access.')) return;
        try {
            await teamsApi.archiveTeam(id);
            router.push('/dashboard/teams');
        } catch (e: any) { alert(e.response?.data?.message || 'Failed'); }
    };

    const handleTaskUpdated = (updated: any) => {
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        if (selectedTask?.id === updated.id) setSelectedTask(updated);
        loadStats();
    };

    const handleTaskDeleted = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        loadStats();
    };

    const handleTaskCreated = (task: any) => {
        setTasks(prev => [task, ...prev]);
        loadStats();
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
        </div>
    );
    if (!team) return null;

    const TABS: { key: Tab; label: string; icon: any }[] = [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'tasks', label: 'Tasks', icon: CheckSquare },
        { key: 'milestones', label: 'Roadmap', icon: Target },
        { key: 'progress', label: 'Progress', icon: TrendingUp },
        { key: 'chat', label: 'Chat', icon: MessageSquare },
        { key: 'files', label: 'Files', icon: FolderOpen },
        { key: 'announcements', label: 'Announcements', icon: Megaphone },
        { key: 'meetings', label: 'Meetings', icon: BookOpen },
        { key: 'members', label: 'Members', icon: Users },
        { key: 'activity', label: 'Activity', icon: Activity },
        ...(isLeader ? [{ key: 'settings' as Tab, label: 'Settings', icon: Settings }] : []),
    ];

    return (
        <div className="space-y-5 max-w-7xl">
            {/* Back + Header */}
            <div>
                <button onClick={() => router.push('/dashboard/teams')}
                    className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Teams
                </button>

                <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] font-bold text-lg shrink-0">
                                {team.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-lg font-bold text-[#0F172A]">{team.name}</h1>
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
                                <p className="text-sm text-[#64748B] mt-0.5">{team.description || team.purpose || 'No description.'}</p>
                            </div>
                        </div>
                        {isLeader && (
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => setShowInvite(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded-lg transition">
                                    <UserPlus className="h-3.5 w-3.5" /> Invite
                                </button>
                                <button onClick={() => setShowEdit(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-semibold rounded-lg transition">
                                    <Settings className="h-3.5 w-3.5" /> Edit
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-[#64748B] font-medium">Invite Code:</span>
                        <code className="text-sm font-mono font-bold text-[#1D4ED8] bg-[#EFF6FF] px-3 py-1 rounded-lg tracking-widest">
                            {team.invite_code}
                        </code>
                        <button onClick={copyCode} className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#1D4ED8] transition-colors">
                            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                        {isLeader && (
                            <button onClick={handleRegenCode} className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#64748B] transition-colors ml-auto">
                                <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-xl overflow-x-auto">
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap
                            ${activeTab === tab.key ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}>
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Dashboard Tab ── */}
            {activeTab === 'dashboard' && <ProjectDashboard stats={stats} />}

            {/* ── Tasks Tab ── */}
            {activeTab === 'tasks' && (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                            <input placeholder="Search tasks..."
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                                value={taskFilter.search}
                                onChange={e => setTaskFilter(f => ({ ...f, search: e.target.value }))} />
                        </div>
                        <select className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] transition"
                            value={taskFilter.status}
                            onChange={e => setTaskFilter(f => ({ ...f, status: e.target.value }))}>
                            <option value="">All Status</option>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Under Review</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                        <select className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] transition"
                            value={taskFilter.priority}
                            onChange={e => setTaskFilter(f => ({ ...f, priority: e.target.value }))}>
                            <option value="">All Priority</option>
                            <option value="URGENT">Urgent</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                        {isLeader && (
                            <button onClick={() => setShowCreateTask(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition ml-auto">
                                <Plus className="h-4 w-4" /> New Task
                            </button>
                        )}
                    </div>

                    <TaskBoard
                        tasks={tasks}
                        onTaskClick={setSelectedTask}
                        isLeader={isLeader}
                        onStatusChange={(taskId, status) => {
                            teamTasksApi.updateTask(id, taskId, { status })
                                .then(r => handleTaskUpdated(r.data))
                                .catch(e => alert(e.response?.data?.message || 'Failed'));
                        }}
                    />
                </div>
            )}

            {/* ── Milestones Tab ── */}
            {activeTab === 'milestones' && (
                <MilestonesView
                    teamId={id}
                    milestones={milestones}
                    tasks={tasks}
                    isLeader={isLeader}
                    onRefresh={() => { loadMilestones(); loadStats(); }}
                />
            )}

            {/* ── Progress Tab ── */}
            {activeTab === 'progress' && (
                <ProgressView
                    teamId={id}
                    updates={progressUpdates}
                    isLeader={isLeader}
                    onRefresh={loadProgress}
                />
            )}

            {/* ── Chat Tab ── */}
            {activeTab === 'chat' && (
                <TeamChat
                    teamId={id}
                    currentUser={currentUser}
                    members={activeMembers}
                    isLeader={isLeader}
                />
            )}

            {/* ── Files Tab ── */}
            {activeTab === 'files' && (
                <FileManager
                    teamId={id}
                    currentUser={currentUser}
                    isLeader={isLeader}
                />
            )}

            {/* ── Announcements Tab ── */}
            {activeTab === 'announcements' && (
                <Announcements
                    teamId={id}
                    currentUser={currentUser}
                    isLeader={isLeader}
                />
            )}

            {/* ── Meetings Tab ── */}
            {activeTab === 'meetings' && (
                <MeetingNotes
                    teamId={id}
                    currentUser={currentUser}
                    isLeader={isLeader}
                    members={activeMembers}
                />
            )}

            {/* ── Members Tab ── */}
            {activeTab === 'members' && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[#0F172A]">Team Members ({activeMembers.length})</h2>
                        {isLeader && (
                            <button onClick={() => setShowInvite(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] text-white text-xs font-semibold rounded-lg hover:bg-[#1E40AF] transition">
                                <UserPlus className="h-3.5 w-3.5" /> Invite Member
                            </button>
                        )}
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Member</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Role</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Joined</th>
                                {isLeader && <th className="px-5 py-3" />}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9]">
                            {activeMembers.map((m: any) => (
                                <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors group">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] text-xs font-bold shrink-0">
                                                {m.user?.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[#0F172A] flex items-center gap-1.5">
                                                    {m.user?.name}
                                                    {m.user_id === currentUser?.id && <span className="text-[10px] text-[#94A3B8]">(you)</span>}
                                                </p>
                                                <p className="text-xs text-[#94A3B8]">{m.user?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {isLeader && m.role !== 'LEADER' ? (
                                            <select className="text-xs font-semibold px-2 py-1 rounded-full border border-[#E2E8F0] bg-white focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                                                value={m.role}
                                                onChange={e => handleRoleChange(m.user_id, e.target.value)}
                                                disabled={actionLoading === m.user_id + m.role}>
                                                <option value="MEMBER">Member</option>
                                                <option value="REVIEWER">Reviewer</option>
                                                <option value="VIEWER">Viewer</option>
                                            </select>
                                        ) : (
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role]}`}>
                                                {m.role === 'LEADER' && <Crown className="h-3 w-3 inline mr-1" />}
                                                {m.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-[#94A3B8]">
                                        {new Date(m.joined_at).toLocaleDateString()}
                                    </td>
                                    {isLeader && (
                                        <td className="px-5 py-3.5">
                                            {m.role !== 'LEADER' && (
                                                <button onClick={() => handleRemoveMember(m.user_id)}
                                                    disabled={actionLoading === m.user_id}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                                                    <UserMinus className="h-4 w-4" />
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Activity Tab ── */}
            {activeTab === 'activity' && (
                <ActivityFeed teamId={id} />
            )}

            {/* ── Settings Tab ── */}
            {activeTab === 'settings' && isLeader && (
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                        <h2 className="text-sm font-semibold text-[#0F172A] mb-1">Team Settings</h2>
                        <p className="text-xs text-[#64748B] mb-4">Manage team configuration and access.</p>
                        <button onClick={() => setShowEdit(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-sm font-medium text-[#0F172A] rounded-lg transition">
                            <Settings className="h-4 w-4" /> Edit Team Details
                        </button>
                    </div>
                    <div className="bg-white rounded-xl border border-red-200 p-5">
                        <h2 className="text-sm font-semibold text-red-700 mb-1">Danger Zone</h2>
                        <p className="text-xs text-[#64748B] mb-4">These actions are irreversible.</p>
                        <button onClick={handleArchive}
                            className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-sm font-medium text-red-700 rounded-lg transition">
                            <Trash2 className="h-4 w-4" /> Archive Team
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showInvite && (
                <InviteMemberModal teamId={id} inviteCode={team.invite_code} onClose={() => setShowInvite(false)} />
            )}
            {showEdit && (
                <EditTeamModal team={team} onClose={() => setShowEdit(false)}
                    onUpdated={(updated: any) => { setTeam((t: any) => ({ ...t, ...updated })); setShowEdit(false); }} />
            )}
            {showCreateTask && (
                <CreateTaskModal teamId={id} members={activeMembers} onClose={() => setShowCreateTask(false)} onCreated={handleTaskCreated} />
            )}
            {selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    teamId={id}
                    currentUser={currentUser}
                    isLeader={isLeader}
                    members={activeMembers}
                    onClose={() => setSelectedTask(null)}
                    onUpdated={handleTaskUpdated}
                    onDeleted={handleTaskDeleted}
                />
            )}
        </div>
    );
}
