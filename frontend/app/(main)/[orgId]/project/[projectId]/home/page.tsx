"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from '@/app/lib/useAuth';
import {
    Activity,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ArrowRight,
    TrendingUp,
    Briefcase
} from "lucide-react";
import api from "@/app/lib/api";

export default function ProjectHomePage() {
    const { orgId, projectId } = useParams();
    const { user } = useAuth();
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            fetchProjectStats();
        }
    }, [projectId]);

    const fetchProjectStats = async () => {
        setLoading(true);
        try {
            // Fetch project details and tasks together to calculate stats
            const [projectRes, tasksRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/tasks?project_id=${projectId}`)
            ]);

            setProject(projectRes.data.data);
            const tasks = tasksRes.data.data || [];

            // Calculate stats based on real data
            setStats([
                {
                    label: "Overdue Tasks",
                    value: tasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status?.name !== 'Completed').length.toString().padStart(2, '0'),
                    icon: <AlertCircle size={20} />,
                    color: "text-rose-600",
                    bg: "bg-rose-50",
                    description: "Past deadline"
                },
                {
                    label: "In Progress",
                    value: tasks.filter((t: any) => t.status?.name === 'In Progress').length.toString().padStart(2, '0'),
                    icon: <Activity size={20} />,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    description: "Currently ongoing"
                },
                {
                    label: "Open Tasks",
                    value: tasks.filter((t: any) => t.status?.name !== 'Completed' && t.status?.name !== 'In Progress').length.toString().padStart(2, '0'),
                    icon: <Clock size={20} />,
                    color: "text-slate-600",
                    bg: "bg-slate-50",
                    description: "To be started"
                },
            ]);
        } catch (err) {
            console.error("Error fetching project stats", err);
        } finally {
            setLoading(false);
        }
    };

    if (!user || loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{project?.name} Overview</h2>
                    <p className="text-slate-500">Project statistics and activity summarize.</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats?.map((stat: any, i: number) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                                {stat.icon}
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                        <p className="text-sm font-bold text-slate-900 mt-1">{stat.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{stat.description}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity Mini Feed */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 text-sm">Project Task Stream</h3>
                    <button className="text-xs text-blue-600 font-bold hover:underline">View Detailed Activity</button>
                </div>
                <div className="p-0 divide-y divide-slate-50">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="px-6 py-4 flex gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-slate-600 leading-tight">
                                    <span className="font-bold text-slate-900">Task Update:</span> Status changed for "Design Review"
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">Today at 10:45 AM</p>
                            </div>
                            <div className="ml-auto">
                                <ArrowRight size={14} className="text-slate-300" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
