"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User, Phone, Building, CheckCircle2, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'details' | 'done';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [formData, setFormData] = useState({
        name: '', password: '', phone: '', role: 'STUDENT', organization: '',
    });

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email.endsWith('@gmail.com')) {
            setError('Only @gmail.com addresses are supported.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email });
            setStep('otp');
            startResendCooldown();
        } catch (err: any) {
            const msg = err.response?.data?.message || '';
            if (err.response?.status === 409 || msg.toLowerCase().includes('already')) {
                setError('This email is already registered. Please sign in instead.');
            } else {
                setError(msg || 'Failed to send OTP. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
        setLoading(true);
        try {
            await api.post('/auth/verify-otp', { email, otp });
            setStep('details');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const payload: any = { ...formData, email };
        if (formData.role !== 'EMPLOYEE') delete payload.organization;
        try {
            await api.post('/auth/register', payload);
            setStep('done');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email });
            setOtp('');
            startResendCooldown();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    const startResendCooldown = () => {
        setResendCooldown(60);
        const interval = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const stepLabels = ['Email', 'Verify', 'Details'];
    const stepIndex = step === 'email' ? 0 : step === 'otp' ? 1 : 2;

    if (step === 'done') {
        return (
            <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#0F172A]">Account created</h2>
                    <p className="text-[#64748B] text-sm mt-1">
                        Your account for <span className="font-medium text-[#0F172A]">{email}</span> is ready.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="w-full py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition"
                >
                    Go to Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Create an account</h1>
                <p className="text-[#64748B] text-sm mt-1">
                    {step === 'email' && 'Enter your Gmail to get started'}
                    {step === 'otp' && `Enter the 6-digit code sent to ${email}`}
                    {step === 'details' && 'Fill in your profile details'}
                </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2">
                {stepLabels.map((label, i) => (
                    <div key={label} className="flex items-center gap-2 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                            ${i < stepIndex ? 'bg-green-500 text-white' : i === stepIndex ? 'bg-[#1D4ED8] text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'}`}>
                            {i < stepIndex ? '✓' : i + 1}
                        </div>
                        <span className={`text-xs font-medium ${i === stepIndex ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{label}</span>
                        {i < 2 && <div className={`flex-1 h-px ${i < stepIndex ? 'bg-green-500' : 'bg-[#E2E8F0]'}`} />}
                    </div>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                    <span className="flex-1">{error}</span>
                    {error.includes('already registered') && (
                        <Link href="/login" className="text-[#1D4ED8] font-medium underline whitespace-nowrap text-xs">Sign in</Link>
                    )}
                </div>
            )}

            {/* Step 1: Email */}
            {step === 'email' && (
                <form onSubmit={handleSendOtp} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-[#0F172A]">Gmail address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                            <input
                                id="email" type="email" placeholder="you@gmail.com"
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                                value={email} onChange={(e) => setEmail(e.target.value)} required
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        {loading ? 'Sending OTP...' : 'Send verification code'}
                    </button>
                </form>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="otp" className="text-sm font-medium text-[#0F172A]">Verification code</label>
                        <input
                            id="otp" type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                            className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] bg-white text-2xl font-bold text-center text-[#1D4ED8] tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required
                        />
                        <p className="text-xs text-[#64748B]">Check your Gmail inbox and spam folder.</p>
                    </div>
                    <button type="submit" disabled={loading || otp.length !== 6}
                        className="w-full py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? 'Verifying...' : 'Verify code'}
                    </button>
                    <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0 || loading}
                        className="w-full text-sm text-[#64748B] hover:text-[#1D4ED8] disabled:opacity-40 flex items-center justify-center gap-2 transition">
                        <RefreshCw className="h-3.5 w-3.5" />
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                </form>
            )}

            {/* Step 3: Details */}
            {step === 'details' && (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#0F172A]">Full name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                                <input placeholder="John Doe" required
                                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#0F172A]">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                                <input placeholder="+1 555 0000" required
                                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0F172A]">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                            <input type="password" placeholder="Min. 8 characters" required minLength={8}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#0F172A]">Role</label>
                        <select
                            className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition"
                            value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value, organization: '' })}>
                            <option value="STUDENT">Student</option>
                            <option value="MANAGER">Manager</option>
                            <option value="CLIENT">Client</option>
                        </select>
                    </div>

                    {/* Organization field removed — employees are created by managers */}

                    <button type="submit" disabled={loading}
                        className="w-full py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? 'Creating account...' : 'Create account'}
                        {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                </form>
            )}

            <p className="text-sm text-[#64748B] text-center">
                Already have an account?{' '}
                <Link href="/login" className="text-[#1D4ED8] font-medium hover:underline">Sign in</Link>
            </p>
        </div>
    );
}
