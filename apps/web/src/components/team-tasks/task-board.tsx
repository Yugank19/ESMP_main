"use client";

import { useState } from 'react';
import { Clock, User, AlertTriangle, ChevronRight } from 'lucide-react';

const STATUS_COLS = [
    { key: 'TODO', label: 'To Do', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    { key: 'REVIEW', label: 'Under Review', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
    { key: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
];

const PRIORITY_COLORS: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
};

function isOverdue(task: any) {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED';
}

function daysUntil(date: string) {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    return diff;
}

export default function TaskBoard({ tasks, onTaskClick, isLeader, onStatusChange }: {
    tasks: any[];
    onTaskClick: (task: any) => void;
    isLeader: boolean;
    onStatusChange: (taskId: string, status: string) => void;
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATUS_COLS.map(col => {
                const colTasks = tasks.filter(t => t.status === col.key);
                return (
                    <div key={col.key} className="flex flex-col gap-3">
                        {/* Column header */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                                <span className="text-xs font-semibold text-[#0F172A]">{col.label}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.color}`}>
                                {colTasks.length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className="space-y-2.5 min-h-[120px]">
                            {colTasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onClick={() => onTaskClick(task)}
                                    isLeader={isLeader}
                                    onStatusChange={onStatusChange}
                                />
                            ))}
                            {colTasks.length === 0 && (
                                <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-4 text-center">
                                    <p className="text-xs text-[#94A3B8]">No tasks</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TaskCard({ task, onClick, isLeader, onStatusChange }: any) {
    const overdue = isOverdue(task);
    const days = task.due_date ? daysUntil(task.due_date) : null;

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl border p-3.5 cursor-pointer hover:shadow-md transition-all group
                ${overdue ? 'border-red-200 bg-red-50/30' : 'border-[#E2E8F0] hover:border-[#1D4ED8]/30'}`}
        >
            {/* Priority + overdue */}
            <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.LOW}`}>
                    {task.priority}
                </span>
                {overdue && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
                        <AlertTriangle className="h-3 w-3" /> Overdue
                    </span>
                )}
            </div>

            {/* Title */}
            <p className="text-sm font-semibold text-[#0F172A] leading-snug mb-2 group-hover:text-[#1D4ED8] transition-colors">
                {task.title}
            </p>

            {/* Assignees */}
            {task.assignees?.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex -space-x-1.5">
                        {task.assignees.slice(0, 3).map((a: any) => (
                            <div key={a.user_id}
                                className="w-5 h-5 rounded-full bg-[#EFF6FF] border border-white flex items-center justify-center text-[#1D4ED8] text-[9px] font-bold"
                                title={a.user?.name}>
                                {a.user?.name?.charAt(0)}
                            </div>
                        ))}
                    </div>
                    {task.assignees.length > 3 && (
                        <span className="text-[10px] text-[#94A3B8]">+{task.assignees.length - 3}</span>
                    )}
                </div>
            )}

            {/* Due date */}
            {task.due_date && (
                <div className={`flex items-center gap-1 text-[10px] font-medium ${overdue ? 'text-red-600' : days !== null && days <= 3 ? 'text-amber-600' : 'text-[#94A3B8]'}`}>
                    <Clock className="h-3 w-3" />
                    {overdue
                        ? `${Math.abs(days!)}d overdue`
                        : days === 0 ? 'Due today'
                        : days! < 0 ? `${Math.abs(days!)}d overdue`
                        : `${days}d left`}
                </div>
            )}

            {/* Comments count */}
            {task.comments?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center gap-1 text-[10px] text-[#94A3B8]">
                    <ChevronRight className="h-3 w-3" />
                    {task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
