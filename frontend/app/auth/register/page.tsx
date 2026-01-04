"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/app/lib/api';
import Link from 'next/link';
import { UserPlus, Mail, Lock, CheckCircle, ArrowRight, Sparkles, User } from "lucide-react";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');
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
            <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/40 via-purple-50/40 to-pink-50/40"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-400/20 blur-[120px] rounded-full animate-pulse" />

                <div className="w-full max-w-[400px] bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="mb-6 flex justify-center">
                        <div className="w-16 h-16 bg-white/80 shadow-lg shadow-emerald-500/10 rounded-2xl border border-white flex items-center justify-center">
                            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-md">
                                <CheckCircle size={20} strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-slate-800 tracking-tight">Check Your Email</h2>
                    <p className="mb-8 text-slate-500 text-sm font-medium leading-relaxed">
                        We've sent a verification link to<br />
                        <span className="font-bold text-slate-800">{email}</span>
                    </p>
                    <Link
                        href={`/auth/login${redirectUrl ? '?redirect=' + redirectUrl : ''}`}
                        className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-[0.98] group"
                    >
                        Return to Login
                        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans">
            {/* Enhanced Background matches Login */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/40 via-purple-50/40 to-pink-50/40"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/20 blur-[120px] rounded-full" />

            <div className="w-full max-w-[440px] bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-blue-600 shadow-lg shadow-indigo-500/20 rounded-2xl flex items-center justify-center mb-4 text-white">
                        <UserPlus size={24} className="text-white/90" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create Account</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Join us and start building.</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-rose-50/80 backdrop-blur-sm border border-rose-100 p-3 text-xs text-rose-600 font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 ml-1">Full Name</label>
                        <div className="relative group">
                            <input
                                type="text"
                                required
                                className="w-full bg-white/50 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm pl-11"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                <User size={16} strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 ml-1">Email Address</label>
                        <div className="relative group">
                            <input
                                type="email"
                                required
                                className="w-full bg-white/50 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm pl-11"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                <Mail size={16} strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 ml-1">Password</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/50 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm pl-11"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Lock size={16} strokeWidth={2} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 ml-1">Confirm</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-white/50 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all shadow-sm pl-11"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Lock size={16} strokeWidth={2} />
                                </div>
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
                                <span>Creating Account...</span>
                            </div>
                        ) : (
                            <>
                                <span>Sign Up</span>
                                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200/60 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                        Already have an account?{' '}
                        <Link href={`/auth/login${redirectUrl ? '?redirect=' + redirectUrl : ''}`} className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                            Sign In
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

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterContent />
        </Suspense>
    );
}
