"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api';
import Link from 'next/link';
import { UserPlus, Mail, Lock, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        if (password !== passwordConfirmation) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await api.post('/register', {
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-6 relative overflow-hidden font-sans">
                <div className="absolute top-0 left-0 w-full h-full bg-[#fafafa]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-emerald-50/50 blur-[150px] rounded-full animate-pulse" />

                <div className="w-full max-w-[480px] bg-white/40 backdrop-blur-2xl rounded-[3rem] p-12 shadow-[0_32px_80px_rgba(0,0,0,0.03)] border border-white/80 text-center relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="mb-10 flex justify-center">
                        <div className="w-24 h-24 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-[2rem] border border-white flex items-center justify-center">
                            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <CheckCircle size={32} strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                    <h2 className="mb-4 text-4xl font-black text-slate-950 tracking-tight leading-tight">Verification <br />Required</h2>
                    <p className="mb-10 text-slate-400 font-medium leading-relaxed italic">
                        A secure link has been sent to <br />
                        <span className="font-black text-slate-900 not-italic">{email}</span>
                    </p>
                    <Link
                        href="/auth/login"
                        className="flex items-center justify-center gap-3 w-full bg-slate-950 text-white py-5 rounded-[2rem] font-black hover:bg-slate-900 transition-all shadow-2xl shadow-slate-950/20 active:scale-95 group"
                    >
                        Return to Workspace
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform stroke-[3]" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full bg-[#fafafa]"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-50/30 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-50/30 blur-[150px] rounded-full" />

            <div className="w-full max-w-lg bg-white/40 backdrop-blur-3xl rounded-[3rem] p-12 shadow-[0_32px_80px_rgba(0,0,0,0.03)] border border-white/80 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-2xl flex items-center justify-center mb-6 border border-white">
                        <UserPlus size={28} className="text-slate-950 stroke-[2.5]" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-950 tracking-tight">Create Account</h2>
                    <p className="text-slate-400 font-medium mt-2 italic">Begin your journey with Taskory.</p>
                </div>

                {error && (
                    <div className="mb-8 rounded-2xl bg-rose-50/50 backdrop-blur-md border border-rose-100 p-4 text-xs text-rose-600 font-bold flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                        <div className="relative group">
                            <input
                                type="text"
                                required
                                className="w-full bg-white/50 border border-white/60 rounded-2xl px-6 py-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950/20 transition-all shadow-sm pl-14"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Johnathan Doe"
                            />
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors">
                                <Sparkles size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                        <div className="relative group">
                            <input
                                type="email"
                                required
                                className="w-full bg-white/50 border border-white/60 rounded-2xl px-6 py-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950/20 transition-all shadow-sm pl-14"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                            />
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors">
                                <Mail size={18} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-1">Password</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/50 border border-white/60 rounded-2xl px-6 py-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950/20 transition-all shadow-sm pl-14"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors">
                                    <Lock size={18} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-1">Confirm</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/50 border border-white/60 rounded-2xl px-6 py-4 text-slate-900 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950/20 transition-all shadow-sm pl-14"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-950 transition-colors">
                                    <Lock size={18} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full group bg-slate-950 text-white rounded-[2rem] py-5 font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-950/20 active:scale-[0.98] disabled:opacity-50 mt-4 overflow-hidden"
                    >
                        {loading ? (
                            <div className="flex items-center gap-3 italic">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (
                            <>
                                Create Account
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform stroke-[3]" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-10 text-center text-sm font-bold text-slate-400 italic">
                    Already a member?{' '}
                    <Link href="/auth/login" className="text-slate-950 hover:underline underline-offset-8 decoration-2 transition-all">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
