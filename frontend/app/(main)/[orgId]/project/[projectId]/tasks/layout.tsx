"use client";

import React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { List, BarChart3, Layout, Plus, Folder } from "lucide-react";
import Link from "next/link";
import TasksFilterBar from "@/components/task/TasksFilterBar";

export default function ProjectTasksLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { orgId, projectId } = useParams();
    const pathname = usePathname();
    const router = useRouter();

    const tabs = [
        { id: 'list', label: 'List', icon: <List size={16} />, href: `/${orgId}/project/${projectId}/tasks` },
        { id: 'board', label: 'Board', icon: <Layout size={16} />, href: `/${orgId}/project/${projectId}/tasks/board` },
        { id: 'gantt', label: 'Gantt', icon: <BarChart3 size={16} />, href: `/${orgId}/project/${projectId}/tasks/grant` },
        { id: 'files', label: 'Files', icon: <Folder size={16} />, href: `/${orgId}/project/${projectId}/tasks/files` },
    ];

    const isActive = (href: string) => {
        if (href.endsWith('/tasks')) {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 text-sm uppercase tracking-widest">Project Tasks</h2>
                    <p className="text-slate-500 text-xs mt-1">Manage and track your project execution.</p>
                </div>
                <Link
                    href={`/${orgId}/project/${projectId}/tasks?new=1`}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 text-sm"
                >
                    <Plus size={18} />
                    New Task
                </Link>
            </div>

            {/* View Selection Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200">
                {tabs.map((tab) => {
                    const active = isActive(tab.href);
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${active
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            <TasksFilterBar />

            <div>
                {children}
            </div>
        </div>
    );
}
