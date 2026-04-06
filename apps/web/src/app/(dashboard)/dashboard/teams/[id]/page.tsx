"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Users, Crown, Settings, Copy, Check, ArrowLeft,
    UserPlus, Trash2, Lock, Globe, RefreshCw, UserMinus,
    CheckSquare, Target, TrendingUp, LayoutDashboard, Plus,
    Search, Clock, MessageSquare, FolderOpen, Megaphone, BookOpen, Activity, Video,
    ExternalLink, MoreHorizontal, ChevronDown, Filter, Share2, Star
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
import VideoConference from '@/components/team-collab/video-conference';
import { cn } from '@/lib/utils';

const ROLE_COLORS: Record<string, string> = {
    LEADER: 'bg-amber-50 text-amber-700 border-amber-100',
    MEMBER: 'bg-blue-50 text-blue-700 border-blue-100',
    REVIEWER: 'bg-purple-50 text-purple-700 border-purple-100',
    VIEWER: 'bg-slate-50 text-slate-600 border-slate-200',
};

type Tab = 'dashboard' | 'tasks' | 'milestones' | 'progress' | 'chat' | 'files' | 'announcements' | 'meetings' | 'video' | 'members' | 'activity' | 'settings';

export default function TeamWorkspacePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [team, setTeam] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');

    // Task & Project data
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
        <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
    );
    if (!team) return null;

    const TABS: { key: Tab; label: string; icon: any }[] = [
        { key: 'dashboard', label: 'Summary', icon: LayoutDashboard },
        { key: 'tasks', label: 'Board', icon: CheckSquare },
        { key: 'milestones', label: 'Roadmap', icon: Target },
        { key: 'progress', label: 'Timeline', icon: TrendingUp },
        { key: 'chat', label: 'Discussion', icon: MessageSquare },
        { key: 'files', label: 'Repository', icon: FolderOpen },
        { key: 'announcements', label: 'Bulletins', icon: Megaphone },
        { key: 'video', label: 'Huddle', icon: Video },
        { key: 'members', label: 'Personnel', icon: Users },
        { key: 'activity', label: 'Journal', icon: Activity },
        ...(isLeader ? [{ key: 'settings' as Tab, label: 'Settings', icon: Settings }] : []),
    ];

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Project Header Area */}
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[3px] bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            {team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <nav className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    <span className="hover:text-[var(--text-primary)] cursor-pointer" onClick={() => router.push('/dashboard/teams')}>Projects</span>
                                    <span className="text-[var(--border)]">/</span>
                                    <span className="text-[var(--text-primary)]">{team.name}</span>
                                </nav>
                                <Star className="h-4 w-4 text-amber-400 fill-amber-400 cursor-pointer" />
                            </div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-1 flex items-center gap-3">
                                {team.name}
                                <span className={cn(
                                    "flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-[3px] uppercase tracking-tighter border",
                                    team.visibility === 'PUBLIC' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                                )}>
                                    {team.visibility === 'PUBLIC' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                    {team.visibility}
                                </span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {activeMembers.slice(0, 5).map((m: any) => (
                                <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white bg-[var(--bg-surface-3)] flex items-center justify-center text-[10px] font-bold text-[var(--text-primary)]" title={m.user?.name}>
                                    {m.user?.name?.[0]}
                                </div>
                            ))}
                            {activeMembers.length > 5 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                    +{activeMembers.length - 5}
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowInvite(true)} className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-8 px-3 gap-1.5 font-bold uppercase text-[10px]">
                            <UserPlus className="h-3.5 w-3.5" /> Invite
                        </button>
                        <button className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-8 w-8 p-0 flex items-center justify-center">
                            <MoreHorizontal className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Sub-header / Invite Code Area */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-[3px]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Access Key</span>
                            <code className="text-xs font-mono font-bold text-[var(--color-primary)] px-2 py-0.5 bg-blue-50 rounded tracking-widest">{team.invite_code}</code>
                            <button onClick={copyCode} className="text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors">
                                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                        {isLeader && (
                            <button onClick={handleRegenCode} className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 uppercase tracking-tighter">
                                <RefreshCw className="h-3 w-3" /> Rotate Key
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Updated {new Date(team.updated_at || team.created_at).toLocaleDateString()}</span>
                        <div className="w-[1px] h-3 bg-[var(--border)]" />
                        <span className="flex items-center gap-1.5"><ShieldCheckIcon className="h-3.5 w-3.5" /> High Confidence</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-6 border-b border-[var(--border)] overflow-x-auto no-scrollbar">
                    {TABS.map(tab => (
                        <button 
                            key={tab.key} 
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "pb-3 text-sm font-bold transition-all relative flex items-center gap-2 px-1 whitespace-nowrap",
                                activeTab === tab.key ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-10">
                {/* ── Dashboard Tab ── */}
                {activeTab === 'dashboard' && <ProjectDashboard stats={stats} />}

                {/* ── Tasks Tab ── */}
                {activeTab === 'tasks' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative min-w-[280px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                    <input placeholder="Filter board..." 
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--border)] rounded-[3px] text-sm focus:border-[var(--color-primary)] transition-all outline-none font-medium"
                                        value={taskFilter.search}
                                        onChange={e => setTaskFilter(f => ({ ...f, search: e.target.value }))} />
                                </div>
                                <select className="bg-white border border-[var(--border)] rounded-[3px] px-3 py-2 text-sm font-bold text-[var(--text-secondary)] outline-none hover:bg-[var(--bg-surface-2)] transition-colors"
                                    value={taskFilter.status}
                                    onChange={e => setTaskFilter(f => ({ ...f, status: e.target.value }))}>
                                    <option value="">Any Status</option>
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="REVIEW">Review</option>
                                    <option value="DONE">Done</option>
                                </select>
                                <button className="jira-button bg-white border border-[var(--border)] text-[var(--text-secondary)] h-[38px] px-3 gap-2 font-bold uppercase text-[10px]">
                                    <Filter className="h-4 w-4" /> More Filters
                                </button>
                            </div>
                            {isLeader && (
                                <button onClick={() => setShowCreateTask(true)}
                                    className="jira-button jira-button-primary gap-2 font-bold uppercase text-[10px]">
                                    <Plus className="h-4 w-4" /> Create Task
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

                {/* ── Video Conference Tab ── */}
                {activeTab === 'video' && (
                    <div className="card h-[600px] bg-slate-900 border-none overflow-hidden relative group">
                        <VideoConference
                            teamId={id}
                            teamName={team?.name || 'Team'}
                            currentUser={currentUser}
                            members={activeMembers}
                        />
                    </div>
                )}

                {/* ── Personnel Tab ── */}
                {activeTab === 'members' && (
                    <div className="card overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between">
                            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Active Personnel ({activeMembers.length})</h2>
                            {isLeader && (
                                <button onClick={() => setShowInvite(true)}
                                    className="jira-button jira-button-primary h-8 px-3 gap-1.5 font-bold uppercase text-[10px]">
                                    <UserPlus className="h-3.5 w-3.5" /> Deploy Invite
                                </button>
                            )}
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)]">
                                    <th className="text-left px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Operator</th>
                                    <th className="text-left px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Deployment Role</th>
                                    <th className="text-left px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Access Since</th>
                                    {isLeader && <th className="px-6 py-3" />}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {activeMembers.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-[var(--bg-surface-2)] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-xs font-bold shrink-0 border border-blue-100">
                                                    {m.user?.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                                                        {m.user?.name}
                                                        {m.user_id === currentUser?.id && <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase tracking-tighter bg-blue-50 px-1 rounded-sm border border-blue-100">Self</span>}
                                                    </p>
                                                    <p className="text-[11px] text-[var(--text-muted)] font-medium">{m.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isLeader && m.role !== 'LEADER' ? (
                                                <div className="relative inline-block">
                                                    <select className="appearance-none text-[10px] font-bold px-3 py-1 pr-8 rounded-[3px] border border-[var(--border)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] cursor-pointer uppercase tracking-tight"
                                                        value={m.role}
                                                        onChange={e => handleRoleChange(m.user_id, e.target.value)}
                                                        disabled={actionLoading === m.user_id + m.role}>
                                                        <option value="MEMBER">Member</option>
                                                        <option value="REVIEWER">Reviewer</option>
                                                        <option value="VIEWER">Viewer</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)] pointer-events-none" />
                                                </div>
                                            ) : (
                                                <span className={cn("text-[10px] font-bold px-3 py-1 rounded-[3px] border uppercase tracking-tight", ROLE_COLORS[m.role])}>
                                                    {m.role === 'LEADER' && <Crown className="h-3 w-3 inline mr-1 -mt-0.5" />}
                                                    {m.role}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-[11px] text-[var(--text-muted)] font-bold uppercase tracking-tight">
                                            {new Date(m.joined_at).toLocaleDateString()}
                                        </td>
                                        {isLeader && (
                                            <td className="px-6 py-4">
                                                {m.role !== 'LEADER' && (
                                                    <button onClick={() => handleRemoveMember(m.user_id)}
                                                        disabled={actionLoading === m.user_id}
                                                        className="opacity-0 group-hover:opacity-100 transition-all p-2 rounded-[3px] hover:bg-red-50 text-red-500">
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

                {/* ── Activity Feed Tab ── */}
                {activeTab === 'activity' && (
                    <ActivityFeed teamId={id} />
                )}

                {/* ── Settings Tab ── */}
                {activeTab === 'settings' && isLeader && (
                    <div className="space-y-6">
                        <div className="card p-6">
                            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Team Parameters</h2>
                            <p className="text-xs text-[var(--text-muted)] mb-6 font-medium">Modify the core configuration and governance of this workspace.</p>
                            <button onClick={() => setShowEdit(true)}
                                className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-10 px-4 gap-2 font-bold uppercase text-[11px]">
                                <Settings className="h-4 w-4" /> Edit Configuration
                            </button>
                        </div>
                        <div className="card p-6 border-red-200">
                            <h2 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-2">Restricted Actions</h2>
                            <p className="text-xs text-[var(--text-muted)] mb-6 font-medium">Critical operations that impact the entire team unit. Proceed with caution.</p>
                            <button onClick={handleArchive}
                                className="jira-button bg-red-50 border border-red-200 text-red-700 h-10 px-4 gap-2 font-bold uppercase text-[11px] hover:bg-red-100">
                                <Trash2 className="h-4 w-4" /> Decommission Team
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals & Overlays */}
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

function ShieldCheckIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
