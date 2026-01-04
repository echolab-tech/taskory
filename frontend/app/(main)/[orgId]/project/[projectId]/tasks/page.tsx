"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Clock,
    User as UserIcon,
    MoreHorizontal,
    GripVertical,
    CheckCircle2,
    Sparkles,
    MessageSquare,
    TrendingUp
} from "lucide-react";
import api from "@/app/lib/api";
import { Reorder } from "framer-motion";
import TaskDetailSidebar from "@/components/task/TaskDetailSidebar";


function TasksListContent() {
    const { projectId } = useParams();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Sidebar State
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'details' | 'comments' | 'subtasks'>('details');


    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('new') === '1') {
            openCreateTask();
        }
    }, [searchParams]);

    useEffect(() => {
        if (projectId) {
            fetchTasks();
        }
    }, [projectId]);

    const fetchTasks = async () => {
        try {
            const res = await api.get(`/tasks?project_id=${projectId}`);
            setTasks(res.data.data || []);
        } catch (err) {
            console.error("Error fetching tasks", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReorder = async (newOrder: any[]) => {
        setTasks(newOrder);
        try {
            const reorderData = newOrder.map((task, index) => ({
                id: task.id,
                position: index
            }));
            await api.post('/tasks/reorder', { tasks: reorderData });
        } catch (err) {
            console.error("Error saving new order", err);
        }
    };

    const openTaskDetails = (task: any, scrollToSection?: 'comments' | 'subtasks') => {
        setSelectedTaskId(task.id);
        setSidebarTab(scrollToSection || 'details');
        setIsSidebarOpen(true);
    };

    const openCreateTask = () => {
        setSelectedTaskId('new');
        setSidebarTab('details');
        setIsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
        setSelectedTaskId(null);
        // Clean up the URL query param
        const url = new URL(window.location.href);
        url.searchParams.delete('new');
        router.replace(url.pathname);
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tasks</h1>

            </div>

            {/* Task List Table Header */}
            <div className="bg-white rounded-t-2xl border-x border-t border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-[48px_1fr_120px_140px_140px_140px_80px] bg-slate-50/50 border-b border-slate-100 px-4 py-3 text-[11px] font-black text-slate-600 tracking-[0.15em]">
                    <div></div>
                    <div className="px-2 font-black">Designation</div>
                    <div className="px-2 font-black">Status</div>
                    <div className="px-2 font-black">Assignee</div>
                    <div className="px-2 font-black">Creator</div>
                    <div className="px-2 font-black">Due Date</div>
                    <div className="px-2 text-right">Action</div>
                </div>
            </div>

            {/* Draggable Task List */}
            <div className="bg-white rounded-b-2xl border border-slate-200 shadow-sm min-h-[400px]">

                {tasks.length > 0 ? (
                    <Reorder.Group axis="y" values={tasks} onReorder={handleReorder} className="divide-y divide-slate-50">
                        {tasks.map((task) => (
                            <Reorder.Item
                                key={task.id}
                                value={task}
                                className="grid grid-cols-[48px_1fr_120px_140px_140px_140px_80px] items-center px-4 py-4 hover:bg-slate-50/50 transition-colors group cursor-pointer bg-white"
                                onClick={() => openTaskDetails(task)}
                            >
                                <div className="flex items-center justify-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-900 transition-colors">
                                    <GripVertical size={18} />
                                </div>
                                <div className="px-2 pr-4 min-w-0 flex items-center justify-between gap-3">
                                    <div className="font-bold text-slate-900 text-sm truncate">{task.title}</div>

                                    {(task.subtasks_count > 0 || task.comments_count > 0) && (
                                        <div className="flex items-center gap-3 shrink-0">
                                            {task.subtasks_count > 0 && (
                                                <div
                                                    className="flex items-center gap-1 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); openTaskDetails(task, 'subtasks'); }}
                                                    title={`${task.subtasks_count} Subtasks`}
                                                >
                                                    <TrendingUp className="rotate-90" size={12} />
                                                    <span className="text-[10px] font-bold">{task.subtasks_count}</span>
                                                </div>
                                            )}
                                            {task.comments_count > 0 && (
                                                <div
                                                    className="flex items-center gap-1 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); openTaskDetails(task, 'comments'); }}
                                                    title={`${task.comments_count} Comments`}
                                                >
                                                    <MessageSquare size={12} />
                                                    <span className="text-[10px] font-bold">{task.comments_count}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="px-2 focus:outline-none" onClick={(e) => e.stopPropagation()}>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-wider ${task.status?.name === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        task.status?.name === 'In Progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            'bg-slate-50 text-slate-500 border border-slate-100'
                                        }`}>
                                        {task.status?.name || 'Open'}
                                    </span>
                                </div>
                                <div className="px-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                                            <UserIcon size={12} className="text-slate-400" />
                                        </div>
                                        <span className="text-xs font-medium truncate">{task.assignee?.name || 'Unassigned'}</span>
                                    </div>
                                </div>
                                <div className="px-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                            <Sparkles size={12} className="text-indigo-400" />
                                        </div>
                                        <span className="text-xs font-medium truncate italic text-slate-400">{task.creator?.name || 'Automated'}</span>
                                    </div>
                                </div>
                                <div className="px-2">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="shrink-0 text-slate-400" />
                                        <span className={`text-[11px] font-bold whitespace-nowrap ${!task.due_date
                                            ? 'text-slate-400'
                                            : new Date(task.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
                                                ? 'text-rose-600'
                                                : 'text-emerald-600'
                                            }`}>
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-2 text-right">
                                    <button className="p-2 text-slate-300 hover:text-slate-950 transition-colors rounded-lg hover:bg-white border border-transparent hover:border-slate-100 shadow-none hover:shadow-sm">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
                        <CheckCircle2 size={48} strokeWidth={1} className="text-slate-200" />
                        <p className="text-sm font-medium">No tasks found. Start by creating a new one!</p>
                    </div>
                )}
            </div>

            <TaskDetailSidebar
                taskId={selectedTaskId}
                projectId={projectId as string}
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                onUpdate={fetchTasks}
                initialTab={sidebarTab}
            />


        </div>
    );
}

export default function ProjectTasksListPage() {
    return (
        <div className="max-w-[1600px] mx-auto min-h-screen pb-20">
            <Suspense fallback={<div>Loading...</div>}>
                <TasksListContent />
            </Suspense>
        </div>
    );
}
