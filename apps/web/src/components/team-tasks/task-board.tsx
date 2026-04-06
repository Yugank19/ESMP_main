"use client";

import { useState } from 'react';
import { 
    Clock, User, AlertTriangle, ChevronRight, 
    MessageSquare, Paperclip, ChevronUp, ChevronDown, Equal, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLS = [
    { key: 'TODO', label: 'To Do', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    { key: 'REVIEW', label: 'Under Review', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
    { key: 'COMPLETED', label: 'Done', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
];

const PRIORITY_ICONS: Record<string, any> = {
    URGENT: { icon: ChevronUp, color: 'text-red-600' },
    HIGH: { icon: ChevronUp, color: 'text-orange-500' },
    MEDIUM: { icon: Equal, color: 'text-amber-500' },
    LOW: { icon: ChevronDown, color: 'text-blue-500' },
};

function isOverdue(task: any) {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED' && task.status !== 'DONE';
}

export default function TaskBoard({ tasks, onTaskClick, isLeader, onStatusChange }: {
    tasks: any[];
    onTaskClick: (task: any) => void;
    isLeader: boolean;
    onStatusChange: (taskId: string, status: string) => void;
}) {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar min-h-[calc(100vh-250px)]">
            {STATUS_COLS.map(col => {
                const colTasks = tasks.filter(t => t.status === col.key || (col.key === 'COMPLETED' && t.status === 'DONE'));
                return (
                    <div key={col.key} className="flex-shrink-0 w-72 flex flex-col bg-[#F4F5F7] rounded-[3px] p-2">
                        {/* Column header */}
                        <div className="flex items-center justify-between px-2 py-3 mb-2 sticky top-0 bg-[#F4F5F7] z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{col.label}</span>
                                <span className="text-[11px] font-bold bg-[#DFE1E6] text-[#42526E] px-1.5 py-0.5 rounded-full">
                                    {colTasks.length}
                                </span>
                            </div>
                            <button className="p-1 hover:bg-[#EBECF0] rounded transition-colors text-[#42526E]">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Cards Container */}
                        <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar min-h-[50px]">
                            {colTasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onClick={() => onTaskClick(task)}
                                />
                            ))}
                            
                            {/* Empty State placeholder */}
                            {colTasks.length === 0 && (
                                <div className="h-10 border border-dashed border-[#DFE1E6] rounded-[3px] flex items-center justify-center">
                                    <span className="text-[10px] text-[#A5ADBA] font-medium uppercase tracking-tight">No Items</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function TaskCard({ task, onClick }: any) {
    const overdue = isOverdue(task);
    const Priority = PRIORITY_ICONS[task.priority] || PRIORITY_ICONS.LOW;

    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white rounded-[3px] border border-[#DFE1E6] p-3 shadow-sm cursor-pointer hover:bg-[#F4F5F7] transition-all group relative",
                overdue && "border-l-4 border-l-red-600"
            )}
        >
            {/* Title */}
            <p className="text-sm text-[#172B4D] leading-snug mb-3 group-hover:text-[var(--color-primary)] transition-colors">
                {task.title}
            </p>

            {/* Bottom Meta */}
            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                    {/* Priority Icon */}
                    <Priority.icon className={cn("h-4 w-4", Priority.color)} />
                    
                    {/* Task Key / ID (Mocked as ESMP-XXX) */}
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                        {task.team_name?.split(' ')[0] || 'TASK'}-{task.id.slice(0, 3)}
                    </span>
                    
                    {/* Attachments / Comments Indicators */}
                    <div className="flex items-center gap-2 ml-1">
                        {task.comments?.length > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] font-bold">
                                <MessageSquare className="h-3 w-3" />
                                {task.comments.length}
                            </div>
                        )}
                        {task.totalFiles > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] font-bold">
                                <Paperclip className="h-3 w-3" />
                                {task.totalFiles}
                            </div>
                        )}
                    </div>
                </div>

                {/* Assignee Avatar */}
                <div className="flex items-center gap-1.5">
                    {overdue && (
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" title="Overdue" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-[9px] font-bold flex items-center justify-center border border-white">
                        {task.assignees?.[0]?.user?.name?.charAt(0) || task.user?.name?.charAt(0) || '?'}
                    </div>
                </div>
            </div>
        </div>
    );
}
