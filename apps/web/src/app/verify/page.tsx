"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShieldCheck, XCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setError('System Protocol Error: Missing authentication token.');
            return;
        }

        const verify = async () => {
            try {
                const response = await api.get('/auth/verify-email', { params: { token } });
                setStatus('success');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } catch (err: any) {
                setStatus('error');
                setError(err.response?.data?.message || 'Access Denied: Credential link has expired or is invalid.');
            }
        };

        verify();
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-secondary-surface/30 px-6">
            <Card className="w-full max-w-md border-slate-100 shadow-[0_32px_128px_rgba(0,102,204,0.1)] bg-white rounded-[2rem] p-4 text-center">
                <CardHeader className="p-8 pb-12">
                    <div className="flex justify-center mb-10">
                        {status === 'verifying' && (
                            <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20 shadow-lg animate-pulse">
                                <Loader2 className="h-10 w-10 animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="w-20 h-20 rounded-[2rem] bg-success/10 flex items-center justify-center text-success border-2 border-success/20 shadow-lg animate-bounce">
                                <CheckCircle2 className="h-10 w-10" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="w-20 h-20 rounded-[2rem] bg-error/10 flex items-center justify-center text-error border-2 border-error/20 shadow-lg">
                                <XCircle className="h-10 w-10" />
                            </div>
                        )}
                    </div>
                    <CardTitle className="text-4xl font-black tracking-tight font-heading text-text-primary">
                        {status === 'verifying' && 'Syncing Credentials'}
                        {status === 'success' && 'Entry Authorized'}
                        {status === 'error' && 'Protocol Failure'}
                    </CardTitle>
                    <CardDescription className="text-text-secondary font-medium text-lg mt-4">
                        {status === 'verifying' && 'Establishing secure link with corporate identity providers...'}
                        {status === 'success' && 'Redirecting to executive workspace...'}
                        {status === 'error' && error}
                    </CardDescription>
                </CardHeader>
                {status === 'error' && (
                    <CardContent className="flex justify-center pb-12">
                        <button
                            onClick={() => router.push('/login')}
                            className="text-xs font-black text-primary uppercase tracking-[0.2em] border-b-2 border-primary/20 hover:border-primary transition-all pb-1"
                        >
                            Execute Restart
                        </button>
                    </CardContent>
                )}
                <div className="pb-8">
                    <p className="text-[10px] text-text-secondary/40 uppercase tracking-[0.3em] font-black">
                        Authorized Verification Service
                    </p>
                </div>
            </Card>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-secondary-surface/30">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
