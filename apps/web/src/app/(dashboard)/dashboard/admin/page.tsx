"use client";

import { useEffect, useState } from 'react';
import { Users, UserPlus, Search, MoreVertical, Shield } from 'lucide-react';
import api from '@/lib/api';

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/admin/users')
            .then(r => setUsers(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-5 ">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[#0F172A]">Admin Panel</h1>
                    <p className="text-sm text-[#64748B] mt-0.5">Manage users and system settings</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition">
                    <UserPlus className="h-4 w-4" /> Add User
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-[#0F172A]">{users.length}</p>
                        <p className="text-xs text-[#64748B]">Total Users</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-[#0F172A]">Active</p>
                        <p className="text-xs text-[#64748B]">System Status</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-[#0F172A]">4</p>
                        <p className="text-xs text-[#64748B]">Roles Configured</p>
                    </div>
                </div>
            </div>

            {/* User table */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[#0F172A]">All Users</h2>
                    <div className="relative w-56">
                        <Search className="absolute left-3 top-2 h-4 w-4 text-[#94A3B8]" />
                        <input
                            placeholder="Search users..."
                            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                            value={search} onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">User</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Role</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748B]">Joined</th>
                            <th className="px-5 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i}>
                                    <td colSpan={5} className="px-5 py-4">
                                        <div className="h-4 bg-[#F1F5F9] rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-5 py-12 text-center text-sm text-[#64748B]">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((user) => (
                                <tr key={user.id} className="hover:bg-[#F8FAFC] transition-colors group">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] text-xs font-bold shrink-0">
                                                {user.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[#0F172A]">{user.name}</p>
                                                <p className="text-xs text-[#94A3B8]">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                                            {(user.roles?.[0]?.role?.name || 'No role').toLowerCase()}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            <span className="text-xs text-[#64748B]">Active</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-[#94A3B8]">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'â€”'}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[#F1F5F9]">
                                            <MoreVertical className="h-4 w-4 text-[#64748B]" />
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
