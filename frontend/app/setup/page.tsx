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
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden font-sans">
            {/* Enhanced Background matches Login/Register */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/40 via-purple-50/40 to-pink-50/40"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/20 blur-[120px] rounded-full" />

            <div className="w-full max-w-[480px] bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/50 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-tr from-slate-800 to-slate-900 shadow-lg shadow-slate-900/20 rounded-2xl flex items-center justify-center mb-4 text-white hover:scale-105 transition-transform duration-300">
                        <Rocket size={24} className="text-white/90" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight text-center">Initialize Workspace</h2>
                    <p className="text-slate-500 text-sm mt-1 text-center font-medium">Let's get your environment ready.</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-rose-50/80 backdrop-blur-sm border border-rose-100 p-3 text-xs text-rose-600 font-semibold flex items-center gap-2 animate-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 ml-1">
                            <Building2 size={14} className="text-slate-400" />
                            Entity Name
                        </label>
                        <input
                            type="text"
                            required
                            autoFocus
                            className="w-full bg-white/50 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900/50 transition-all shadow-sm"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            placeholder="e.g. Global Tech Solutions"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 ml-1">
                            <Sparkles size={14} className="text-slate-400" />
                            Launch Project <span className="opacity-50 font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            className="w-full bg-white/50 border border-slate-200/60 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900/50 transition-all shadow-sm"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g. Platform Redesign"
                        />
                        <p className="text-[10px] text-slate-400 font-medium ml-1">You can add more projects later.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full group bg-slate-900 text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-[0.98] disabled:opacity-70 mt-2"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Launching...</span>
                            </div>
                        ) : (
                            <>
                                <span>Finalize Workspace</span>
                                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Subtle Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase opacity-60">Taskory</p>
            </div>
        </div>
    );
}
