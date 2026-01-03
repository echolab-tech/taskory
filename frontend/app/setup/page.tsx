"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api';
import { Sparkles, Building2, Rocket, ArrowRight } from "lucide-react";

export default function SetupPage() {
    const router = useRouter();
    const [organizationName, setOrganizationName] = useState('');
    const [projectName, setProjectName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/setup/organization', {
                organization_name: organizationName,
                project_name: projectName || null,
            });
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Setup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full bg-[#fafafa]"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-50/50 blur-[150px] rounded-full" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-50/50 blur-[150px] rounded-full" />

            <div className="w-full max-w-[640px] bg-white/40 backdrop-blur-3xl rounded-[3rem] p-12 shadow-[0_32px_80px_rgba(0,0,0,0.03)] border border-white/80 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                <div className="flex flex-col items-center mb-12">
                    <div className="w-24 h-24 bg-white shadow-[0_15px_40px_rgba(0,0,0,0.06)] rounded-[2rem] border border-white flex items-center justify-center mb-8 transform hover:scale-105 transition-transform duration-500">
                        <div className="w-16 h-16 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl">
                            <Rocket size={32} className="stroke-[2.5]" />
                        </div>
                    </div>
                    <h2 className="text-5xl font-black text-slate-950 tracking-tight text-center leading-tight">Initialize Workspace</h2>
                    <p className="text-slate-400 font-medium mt-3 text-center italic">Crafting your professional workspace.</p>
                </div>

                {error && (
                    <div className="mb-8 rounded-2xl bg-rose-50/50 backdrop-blur-md border border-rose-100 p-5 text-xs text-rose-600 font-bold flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 text-[11px] font-black tracking-[0.3em] text-slate-400 ml-1">
                            <Building2 size={14} className="text-slate-300" />
                            Entity Name
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            className="w-full bg-white/50 border border-white/70 rounded-2xl px-8 py-6 text-slate-950 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950/20 transition-all shadow-sm"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            placeholder="e.g. Global Tech Solutions"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 text-[11px] font-black tracking-[0.3em] text-slate-400 ml-1">
                            <Sparkles size={14} className="text-slate-300" />
                            Launch Project <span className="opacity-40 text-[9px] lowercase tracking-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            className="w-full bg-white/50 border border-white/70 rounded-2xl px-8 py-6 text-slate-950 font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950/20 transition-all shadow-sm"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g. Platform Redesign 2024"
                        />
                        <p className="text-[11px] text-slate-400 font-bold ml-1 italic opacity-60">You can initialize multiple projects later.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full group bg-slate-950 text-white rounded-[2.5rem] py-6 font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-slate-950/20 active:scale-[0.98] disabled:opacity-50 mt-4 h-20"
                    >
                        {loading ? (
                            <div className="flex items-center gap-3 italic">
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Launching...
                            </div>
                        ) : (
                            <>
                                <span className="text-lg">Finalize Workspace</span>
                                <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform stroke-[3]" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
