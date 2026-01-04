"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/app/lib/api';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

function AcceptInviteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying invitation...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('No invitation token found.');
            return;
        }

        const acceptInvite = async () => {
            try {
                // Check if user is logged in
                const storedToken = localStorage.getItem('token');
                if (!storedToken) {
                    // Redirect to login/register with return URL logic (simplified here)
                    // For now, simple error telling them to login
                    setStatus('error');
                    setMessage('Please log in or register to accept this invitation.');
                    return;
                }

                await api.post('/organizations/accept-invite', { token });
                setStatus('success');
                setMessage('Successfully joined the organization!');
                setTimeout(() => router.push('/dashboard'), 2000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Failed to accept invitation.');
            }
        };

        acceptInvite();
    }, [token, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/40 via-purple-50/40 to-pink-50/40"></div>

            <div className="w-full max-w-[400px] bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 relative z-10 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20 rounded-2xl flex items-center justify-center mb-4 text-white">
                        <Sparkles size={24} fill="currentColor" className="text-white/90" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Organization Invite</h2>
                </div>

                <div className="space-y-4">
                    {status === 'verifying' && (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-sm font-medium text-slate-500">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-3 animate-in slide-in-from-bottom-2">
                            <CheckCircle size={48} className="text-green-500" />
                            <p className="text-sm font-bold text-green-600">{message}</p>
                            <p className="text-xs text-slate-400">Redirecting to dashboard...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-2">
                            <AlertCircle size={48} className="text-rose-500" />
                            <p className="text-sm font-bold text-rose-600">{message}</p>

                            <div className="flex gap-2 w-full pt-4">
                                <Link
                                    href={`/auth/login?redirect=/accept-invite?token=${token}`}
                                    className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Log In
                                </Link>
                                <Link
                                    href={`/auth/register?redirect=/accept-invite?token=${token}`}
                                    className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Register
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense>
            <AcceptInviteContent />
        </Suspense>
    )
}
