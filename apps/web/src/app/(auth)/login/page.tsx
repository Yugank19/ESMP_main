"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Loader2, Mail, Lock, ArrowRight, ShieldCheck,
    Terminal, Zap, Fingerprint, Activity, Info
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const inputClass = "w-full pl-12 pr-4 py-3 md:py-4 bg-white border border-slate-200 rounded-[3px] text-sm font-bold text-slate-900 placeholder:text-slate-200 outline-none focus:border-blue-500 shadow-sm transition-all uppercase tracking-tight";
const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block pl-1";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email.endsWith('@gmail.com')) {
            setError('PROTOCOL_MISMATCH: ONLY @GMAIL.COM DOMAINS AUTHORIZED.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', formData);
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            const role = (res.data.user.roles?.[0] || '').toUpperCase();
            if (role === 'CLIENT') {
                router.push('/client-dashboard');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'AUTHENTICATION_FAILURE: INVALID CREDENTIALS.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Mission Entry Header */}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2.5 bg-blue-50/50 text-blue-600 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-[2px] border border-blue-100 shadow-sm">
                    <Fingerprint className="h-3 w-3" />
                    Secure_Access_Hub_V5
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                        Enterprise<br />
                        Registry Login
                    </h1>
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mt-3 flex items-center gap-2">
                        <Activity className="h-3 w-3 text-emerald-500" /> System_Online: Enter personnel credentials
                    </p>
                </div>
            </div>

            {/* Auth Terminal Form */}
            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-[3px] text-[10px] font-black uppercase tracking-widest animate-in shake duration-500 flex items-center gap-3 shadow-md shadow-red-100/50">
                        <Info className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label htmlFor="email" className={labelClass}>
                        Personnel_Ident_Email
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            id="email"
                            type="email"
                            placeholder="UNIT_NAME@GMAIL.COM"
                            className={inputClass}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className={labelClass}>
                            Auth_Cipher_Key
                        </label>
                        <button type="button" className="text-[9px] text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest transition-opacity hover:opacity-100 opacity-60">
                            Forgot_Key?
                        </button>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••••••"
                            className={cn(inputClass, "tracking-widest")}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-[3px] transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] active:scale-[0.97] group border-b-4 border-blue-800"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>Log In <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" /></>
                    )}
                </button>
            </form>

            {/* Tactical Divider */}
            <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-white px-6 text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">
                        OR
                    </span>
                </div>
            </div>

            <Link
                href="/register"
                className="w-full h-12 border-2 border-slate-50 bg-slate-50/50 hover:bg-white hover:border-blue-100 text-slate-500 hover:text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-[3px] transition-all flex items-center justify-center gap-3 shadow-inner hover:shadow-lg group"
            >
                <Fingerprint className="h-4 w-4 group-hover:rotate-12 transition-transform" /> Register_New_Personnel
            </Link>

            {/* Compliance Segments */}
            <div className="grid grid-cols-1 gap-3 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50/30 border border-slate-100 rounded-[3px]">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PCI_DSS_LEVEL_1_CERT</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-emerald-500 shadow-sm" />
                        <span className="text-[8px] font-black text-emerald-600 uppercase">Secure</span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-6 opacity-30">
                    <div className="flex items-center gap-1.5">
                        <Terminal className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">TLS_1.3_AUTH_V3</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">99.99_UPTIME_CMD</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
