"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from '@/app/lib/useAuth';
import { CheckSquare, Clock, Filter, Search, MoreHorizontal } from "lucide-react";
import api from "@/app/lib/api";

export default function ProjectMyTaskPage() {
    const { orgId, projectId } = useParams();
    const { user } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && projectId) {
            fetchMyTasks();
        }
    }, [user, projectId]);

    const fetchMyTasks = async () => {
        if (!user) return;
        try {
            const res = await api.get(`/tasks?project_id=${projectId}&assignee_id=${user.id}`);
            setTasks(res.data.data || []);
        } catch (err) {
            console.error("Error fetching my tasks", err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Completed': return 'bg-emerald-100 text-emerald-700';
            case 'Blocked': return 'bg-rose-100 text-rose-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                        <CheckSquare size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">My Project Tasks</h2>
                        <p className="text-slate-500">Tasks assigned to you in this project.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Task Name</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                            <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <tr key={task.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-sm font-bold text-slate-900">{task.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(task.status?.name)} uppercase`}>
                                            {task.status?.name || 'Open'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock size={14} />
                                            <span className="text-xs">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                                    No tasks assigned to you in this project.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
