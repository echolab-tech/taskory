"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api';
import Link from 'next/link';
import { LogIn, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
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
        <div className="flex min-h-screen items-center justify-center bg-white p-6 relative overflow-hidden font-sans">
            {/* Soft Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#fafafa]"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-50/50 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-50/50 blur-[150px] rounded-full" />

            <div className="w-full max-w-[480px] bg-white/40 backdrop-blur-2xl rounded-[3rem] p-12 shadow-[0_32px_80px_rgba(0,0,0,0.03)] border border-white/80 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-3xl flex items-center justify-center mb-6 border border-white group">
                        <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-white transform transition-transform group-hover:rotate-12 duration-500">
                            <Sparkles size={28} />
                        </div>
                    </div>
                    <h2 className="text-4xl font-black text-slate-950 tracking-tight text-center">Welcome Back</h2>
                    <p className="text-slate-400 font-medium mt-2 text-center italic">Your premium workspace awaits.</p>
                </div>

                {error && (
                    <div className="mb-8 rounded-2xl bg-rose-50/50 backdrop-blur-md border border-rose-100 p-4 text-xs text-rose-600 font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-1">
                            Identification
                        </label>
                        <div className="relative group">
                            <input
                                type="email"
                                required
                                className="w-full bg-white/50 border border-white/60 rounded-2xl px-6 py-5 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950/20 transition-all shadow-sm pl-14"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                            />
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors">
                                <Mail size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-400">
                                Secret Key
                            </label>
                        </div>
                        <div className="relative group">
                            <input
                                type="password"
                                required
                                className="w-full bg-white/50 border border-white/60 rounded-2xl px-6 py-5 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950/20 transition-all shadow-sm pl-14"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors">
                                <Lock size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full group bg-slate-950 text-white rounded-[2rem] py-5 font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-950/20 active:scale-[0.98] disabled:opacity-50 mt-4 overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        {loading ? (
                            <div className="flex items-center gap-3 italic">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform stroke-[3]" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-10 border-t border-slate-100/50 flex flex-col gap-4 text-center">
                    <p className="text-sm font-bold text-slate-400 italic">
                        New here?{' '}
                        <Link href="/auth/register" className="text-slate-950 hover:underline underline-offset-8 decoration-2 transition-all">
                            Request Access
                        </Link>
                    </p>
                    <a href="#" className="text-[10px] font-black tracking-widest text-slate-300 hover:text-slate-950 transition-colors">Recover Password</a>
                </div>
            </div>

            {/* Decorative bottom element */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-20 group">
                <div className="h-[1px] w-12 bg-slate-950"></div>
                <span className="text-[10px] font-black tracking-[0.4em] text-slate-950">Taskory Premium</span>
                <div className="h-[1px] w-12 bg-slate-950"></div>
            </div>
        </div>
    );
}
