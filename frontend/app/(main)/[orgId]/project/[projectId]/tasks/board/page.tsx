"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
    Plus,
    MoreHorizontal,
    User as UserIcon,
    Clock,
    MessageSquare,
    Loader2,
    TrendingUp
} from "lucide-react";
import api from "@/app/lib/api";
import { motion } from "framer-motion";
import TaskDetailSidebar from "@/components/task/TaskDetailSidebar";

export default function KanbanBoardPage() {
    const { projectId } = useParams();
    const [tasks, setTasks] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Sidebar State
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'details' | 'comments' | 'subtasks'>('details');

    const searchParams = useSearchParams();

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId, searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams(searchParams.toString());
            params.set('project_id', projectId as string);

            const [tasksRes, statusRes] = await Promise.all([
                api.get(`/tasks?${params.toString()}`),
                api.get(`/task-statuses?project_id=${projectId}`)
            ]);
            setTasks(tasksRes.data.data || []);
            setStatuses(statusRes.data.data || []);
        } catch (err) {
            console.error("Error fetching board data", err);
        } finally {
            setLoading(false);
        }
    };

    const updateTaskStatus = async (taskId: number, newStatusId: number) => {
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status_id: newStatusId, status: statuses.find(s => s.id === newStatusId) } : t));
            await api.patch(`/tasks/${taskId}`, { status_id: newStatusId });
        } catch (err) {
            console.error("Failed to update status", err);
            fetchData(); // Rollback
        }
    };

    const getTasksByStatus = (statusId: number) => {
        return tasks.filter(t => t.status_id === statusId);
    };

    const openTaskDetails = (task: any, scrollToSection?: 'comments' | 'subtasks') => {
        setSelectedTaskId(task.id);
        setSidebarTab(scrollToSection || 'details');
        setIsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
        setSelectedTaskId(null);
        fetchData();
    };

    if (loading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-medium italic">Building Canvas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar h-[calc(100vh-280px)] min-h-[500px]">
            {statuses.map((status) => (
                <div key={status.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: status.color || '#cbd5e1' }}
                            />
                            <h3 className="text-sm font-black text-slate-700 tracking-tight uppercase">
                                {status.name}
                                <span className="ml-2 text-slate-300 font-bold">
                                    {getTasksByStatus(status.id).length}
                                </span>
                            </h3>
                        </div>
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Column Body */}
                    <div
                        className="flex-1 bg-slate-50/50 rounded-2xl p-2 flex flex-col gap-3 border border-slate-100/50 overflow-y-auto no-scrollbar"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            const taskId = e.dataTransfer.getData("taskId");
                            if (taskId) updateTaskStatus(parseInt(taskId), status.id);
                        }}
                    >
                        {getTasksByStatus(status.id).map((task) => (
                            <motion.div
                                key={task.id}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData("taskId", task.id.toString())}
                                layoutId={task.id.toString()}
                                onClick={() => openTaskDetails(task)}
                                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group ring-offset-2 focus:ring-2 focus:ring-blue-500"
                            >
                                <div className="flex flex-col gap-3">
                                    {/* Priority Badge */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${task.priority === 'high' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                            task.priority === 'medium' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                                                'bg-slate-50 text-slate-500 border-slate-100'
                                            }`}>
                                            {task.priority || 'Medium'}
                                        </span>
                                        <MoreHorizontal size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Title */}
                                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                        {task.title}
                                    </h4>

                                    {/* Subtask/Comment Indicators (Board Style) */}
                                    {(task.subtasks_count > 0 || task.comments_count > 0) && (
                                        <div className="flex items-center gap-3">
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

                                    {/* Metadata */}
                                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-3">
                                            {task.due_date && (
                                                <div className={`flex items-center gap-1.5 ${new Date(task.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
                                                    ? 'text-rose-500'
                                                    : 'text-slate-400'
                                                    }`}>
                                                    <Clock size={12} />
                                                    <span className="text-[10px] font-bold">
                                                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center -space-x-2">
                                            {task.assignee ? (
                                                <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm">
                                                    {task.assignee.name.substring(0, 2).toUpperCase()}
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-300 shadow-sm">
                                                    <UserIcon size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Empty State for Columns */}
            {statuses.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center w-full py-20 text-slate-400 gap-4">
                    <p className="text-sm font-medium italic">Initialize project statuses to view board.</p>
                </div>
            )}

            <TaskDetailSidebar
                taskId={selectedTaskId}
                projectId={projectId as string}
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                onUpdate={fetchData}
                initialTab={sidebarTab}
            />
        </div>
    );
}
