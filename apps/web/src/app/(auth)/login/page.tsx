"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email.endsWith('@gmail.com')) {
            setError('Only @gmail.com addresses are supported.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            // Route based on role
            const role = (res.data.user.roles?.[0] || '').toUpperCase();
            if (role === 'CLIENT') {
                router.push('/client-dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Heading */}
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-2 border border-blue-100/50 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    Secure Enterprise Access
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        Welcome back
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">
                        Enter your credentials to access your workplace.
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-semibold animate-in shake duration-500">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                        Professional Email
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white/50 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                            Password
                        </label>
                        <button type="button" className="text-[10px] text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider transition">
                            Forgot Access?
                        </button>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white/50 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 mt-4 active:scale-[0.98]"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>Log In <ArrowRight className="h-4 w-4" /></>
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-[#F8FAFC]/50 backdrop-blur-sm px-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        New to ESMP?
                    </span>
                </div>
            </div>

            <Link
                href="/register"
                className="w-full py-3.5 px-4 border border-slate-200 bg-white/50 hover:bg-white text-slate-900 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
                Create an account
            </Link>

            {/* Trust badges - Modern Grid */}
            <div className="grid grid-cols-3 gap-3 pt-4">
                {[
                    { label: 'Security', sub: 'TLS 1.3' },
                    { label: 'Privacy', sub: 'GDPR/ISO' },
                    { label: 'Uptime', sub: '99.99%' },
                ].map(b => (
                    <div key={b.label} className="text-center py-2 px-1 rounded-xl bg-slate-50/50 border border-slate-100 flex flex-col items-center justify-center">
                        <p className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">{b.label}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.1em]">{b.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
