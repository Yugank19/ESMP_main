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
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-10">
            {/* Heading */}
            <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1D4ED8] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                    Secure Sign In
                </div>
                <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight leading-tight">
                    Welcome back
                </h1>
                <p className="text-[#64748B] text-base">
                    Sign in to your ESMP account to continue.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-[#0F172A]">
                        Email address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#94A3B8]" />
                        <input
                            id="email"
                            type="email"
                            placeholder="you@gmail.com"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition shadow-sm"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-semibold text-[#0F172A]">
                            Password
                        </label>
                        <button type="button" className="text-xs text-[#1D4ED8] hover:underline font-medium">
                            Forgot password?
                        </button>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#94A3B8]" />
                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition shadow-sm"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-blue-200 mt-2"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>Sign in <ArrowRight className="h-4 w-4" /></>
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E2E8F0]" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-[#F8FAFC] px-4 text-xs text-[#94A3B8] font-medium">
                        New to ESMP?
                    </span>
                </div>
            </div>

            <Link
                href="/register"
                className="w-full py-3 px-4 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
                Create an account
            </Link>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                    { label: 'Secure', sub: 'SSL encrypted' },
                    { label: 'Private', sub: 'Data protected' },
                    { label: 'Reliable', sub: '99.9% uptime' },
                ].map(b => (
                    <div key={b.label} className="text-center p-3 rounded-xl bg-white border border-[#E2E8F0]">
                        <p className="text-xs font-bold text-[#0F172A]">{b.label}</p>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5">{b.sub}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
