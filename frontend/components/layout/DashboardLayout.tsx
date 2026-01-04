"use client";

import React, { useEffect, useState } from "react";
import { AppSidebar } from "./Sidebar";
import { useAuth } from "@/app/lib/useAuth";
import { useParams, usePathname } from "next/navigation";
import { Search, HelpCircle } from "lucide-react";
import api from "@/app/lib/api";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const params = useParams();
    const pathname = usePathname();
    const [projectName, setProjectName] = useState("");

    useEffect(() => {
        if (params.projectId) {
            fetchProjectName(params.projectId as string);
        } else {
            setProjectName("");
        }
    }, [params.projectId]);

    const fetchProjectName = async (id: string) => {
        if (!id) return;
        try {
            const res = await api.get(`/projects/${id}`);
            if (res.data?.data?.name) {
                setProjectName(res.data.data.name);
            }
        } catch (err) {
            console.error("Error fetching project name for header", err);
            setProjectName("Project");
        }
    };

    const getPageTitle = () => {
        if (pathname.includes('/home')) return 'Home Overview';
        if (pathname.includes('/activity')) return 'Activity Stream';
        if (pathname.includes('/mytask')) return 'My Tasks';
        if (pathname.includes('/tasks')) return 'Task Management';
        return 'Project Hub';
    };

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="text-slate-500 font-medium italic">Synchronizing Workspace...</p>
                </div>
            </div>
        );
    }

    // If not logged in, return a simple loader while useAuth handles the redirect
    if (!user) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-white">
                <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] font-sans overflow-hidden relative">
            {/* Global Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-400/10 blur-[120px] rounded-full" />
                <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-pink-400/10 blur-[100px] rounded-full delay-1000 animate-pulse" />
            </div>

            {/* Sidebar Wrapper - High Z-index to ensure Modals/Popups are on top */}
            <div className="h-full flex-shrink-0 relative z-50">
                <AppSidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10 glass-content">
                {/* Header - Simplified: Search, Help (Logo Removed) */}
                <header className="h-16 flex items-center px-8 bg-white/60 backdrop-blur-xl border-b border-white/40 justify-between flex-shrink-0 gap-8 shadow-sm z-40 relative">
                    {/* Left: Spacer to balance layout or keep Search Left-Aligned. Let's make Search expand to fill available space or start from left.
                        Given the design, let's just render the Search and Right Actions. */}

                    {/* Center: Search - Expanded to fill left area now that logo is gone */}
                    <div className="flex-1 max-w-2xl">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-4 py-2.5 border border-white/60 rounded-xl bg-white/40 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 focus:bg-white/80 transition-all font-medium shadow-sm backdrop-blur-sm"
                                placeholder="Search tasks, projects, or documents..."
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-[10px] font-bold text-slate-400 bg-white/50 px-1.5 py-0.5 rounded border border-white/50">⌘K</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Help & User Quick Actions */}
                    <div className="flex items-center gap-2 min-w-[200px] justify-end">
                        <button className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-white/60 rounded-xl transition-all border border-transparent hover:border-white/50" title="Help & Support">
                            <HelpCircle size={20} />
                        </button>
                    </div>
                </header>

                {/* Scrollable Content Container */}
                <main className="flex-1 overflow-y-auto bg-white/20 backdrop-blur-sm scroll-smooth">
                    <div className="p-8 h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
