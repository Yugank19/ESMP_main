"use client";

import { useEffect, useState } from 'react';
import { Briefcase, Plus, Search, Calendar, Users, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';

const statusColors: Record<string, string> = {
    PLANNING: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    ON_HOLD: 'bg-amber-100 text-amber-700',
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/projects')
            .then(r => setProjects(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = projects.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5 ">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#0F172A]">Projects</h1>
                    <p className="text-sm text-[#64748B] mt-0.5">Manage and track all your projects</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition">
                    <Plus className="h-4 w-4" /> New Project
                </button>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                <input
                    placeholder="Search projects..."
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                    value={search} onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-[#F1F5F9] rounded-xl animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-16 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-6 w-6 text-[#1D4ED8]" />
                    </div>
                    <p className="text-sm font-semibold text-[#0F172A]">No projects found</p>
                    <p className="text-xs text-[#64748B] mt-1">Create your first project to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((project) => (
                        <div key={project.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md hover:border-[#1D4ED8]/30 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[project.status] || statusColors.PLANNING}`}>
                                    {project.status?.replace('_', ' ')}
                                </span>
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[#F1F5F9]">
                                    <ArrowUpRight className="h-4 w-4 text-[#64748B]" />
                                </button>
                            </div>
                            <h3 className="text-sm font-semibold text-[#0F172A] mb-1 group-hover:text-[#1D4ED8] transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-xs text-[#64748B] line-clamp-2 mb-4">
                                {project.description || 'No description provided.'}
                            </p>
                            <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-3 border-t border-[#F1F5F9]">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Q4 2025</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>4 members</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
