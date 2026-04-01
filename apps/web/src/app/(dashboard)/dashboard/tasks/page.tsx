"use client";

import { useEffect, useState } from 'react';
import { CheckSquare, Plus, Search, Clock, User, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';

const priorityColors: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW: 'bg-slate-100 text-slate-600',
};

const statusColors: Record<string, string> = {
    TODO: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    DONE: 'bg-green-100 text-green-700',
    BLOCKED: 'bg-red-100 text-red-700',
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/tasks')
            .then(r => setTasks(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = tasks.filter(t =>
        t.title?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5 ">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#0F172A]">Tasks</h1>
                    <p className="text-sm text-[#64748B] mt-0.5">Track and manage your work items</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition">
                    <Plus className="h-4 w-4" /> New Task
                </button>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                <input
                    placeholder="Search tasks..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                    value={search} onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Task</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Priority</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Assignee</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Due</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                        {loading ? (
                            [1, 2, 3, 4].map(i => (
                                <tr key={i}>
                                    <td colSpan={6} className="px-5 py-4">
                                        <div className="h-4 bg-[#F1F5F9] rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-16 text-center">
                                    <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
                                        <CheckSquare className="h-5 w-5 text-[#94A3B8]" />
                                    </div>
                                    <p className="text-sm font-medium text-[#0F172A]">No tasks found</p>
                                    <p className="text-xs text-[#64748B] mt-1">Create a task to get started.</p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((task) => (
                                <tr key={task.id} className="hover:bg-[#F8FAFC] transition-colors group">
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-[#0F172A]">{task.title}</p>
                                        {task.description && (
                                            <p className="text-xs text-[#94A3B8] mt-0.5 truncate max-w-xs">{task.description}</p>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityColors[task.priority] || priorityColors.LOW}`}>
                                            {task.priority || 'LOW'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[task.status] || statusColors.TODO}`}>
                                            {task.status?.replace('_', ' ') || 'TODO'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                                                <User className="h-3 w-3 text-[#1D4ED8]" />
                                            </div>
                                            <span className="text-xs text-[#64748B]">{task.assignee?.name || 'Unassigned'}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                                            <Clock className="h-3.5 w-3.5" />
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'â€”'}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[#F1F5F9]">
                                            <MoreHorizontal className="h-4 w-4 text-[#64748B]" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
