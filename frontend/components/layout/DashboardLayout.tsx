"use client";

import React, { useEffect, useState } from "react";
import { AppSidebar } from "./Sidebar";
import { useAuth } from "@/app/lib/useAuth";
import { useParams, usePathname } from "next/navigation";
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
        <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
            {/* Sidebar with fixed width (managed inside component) */}
            <AppSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Header */}
                <header className="h-16 flex items-center px-8 bg-white border-b border-slate-200 justify-between flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 tracking-widest leading-none mb-1">
                                {projectName || 'Workspace'}
                            </span>
                            <h1 className="text-sm font-black text-slate-900 tracking-tight">
                                {getPageTitle()}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 tracking-widest">
                            {user?.email}
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Container */}
                <main className="flex-1 overflow-y-auto bg-slate-50/30">
                    <div className="p-8 h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
