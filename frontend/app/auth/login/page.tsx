"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/app/lib/api';
import Link from 'next/link';
import { LogIn, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/login', { email, password });
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            if (redirectUrl) {
                router.push(redirectUrl);
                return;
            }

            if (response.data.needs_setup) {
                if (!response.data.email_verified) {
                    setError('Verification required. Please check your inbox.');
                    return;
                }
                router.push('/setup');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans">
            {/* Enhanced Background */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/40 via-purple-50/40 to-pink-50/40"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/20 blur-[120px] rounded-full" />
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-pink-400/20 blur-[100px] rounded-full" />

            {/* Glass Card */}
            <div className="w-full max-w-[400px] bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20 rounded-2xl flex items-center justify-center mb-4 text-white transform transition-transform hover:scale-105 duration-300">
                        <Sparkles size={24} fill="currentColor" className="text-white/90" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center">Welcome Back</h2>
                    <p className="text-slate-500 text-sm mt-1 text-center font-medium">Your productive workspace awaits.</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-rose-50/80 backdrop-blur-sm border border-rose-100 p-3 text-xs text-rose-600 font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 ml-1">
                            Email
                        </label>
                        <div className="relative group">
                            <input
                                type="email"
                                required
                                className="w-full bg-white/50 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all shadow-sm pl-11"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                <Mail size={16} strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-semibold text-slate-600">
                                Password
                            </label>
                            <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Forgot?</a>
                        </div>
                        <div className="relative group">
                            <input
                                type="password"
                                required
                                className="w-full bg-white/50 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all shadow-sm pl-11"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                <Lock size={16} strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full group bg-slate-900 text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 mt-2"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200/60 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                        Don't have an account?{' '}
                        <Link href={`/auth/register${redirectUrl ? '?redirect=' + redirectUrl : ''}`} className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>

            {/* Subtle Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase opacity-60">Taskory</p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
