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
    TrendingUp,
    ChevronRight,
    CornerDownRight,
    ListTodo
} from "lucide-react";
import api from "@/app/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import TaskDetailSidebar from "@/components/task/TaskDetailSidebar";


function TasksListContent() {
    const { projectId } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [tasks, setTasks] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Sidebar State
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'details' | 'comments' | 'subtasks'>('details');
    // Drag State
    const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (searchParams.get('new') === '1') {
            openCreateTask();
        }
    }, [searchParams]);

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId, searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Construct params from URL
            const params = new URLSearchParams(searchParams.toString());
            params.set('project_id', projectId as string);

            const [tasksRes, statusRes] = await Promise.all([
                api.get(`/tasks?${params.toString()}`),
                api.get(`/task-statuses?project_id=${projectId}`)
            ]);
            setTasks(tasksRes.data.data || []);
            setStatuses(statusRes.data.data || []);
        } catch (err) {
            console.error("Error fetching data", err);
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

    const updateTaskOrder = async () => {
        try {
            // Prepare payload matching backend format: { tasks: [{id, position}, ...] }
            const payload = {
                tasks: tasks.map((t, index) => ({
                    id: t.id,
                    position: index
                }))
            };
            await api.post('/tasks/reorder', payload);
        } catch (err) {
            console.error("Failed to update order", err);
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
        fetchData();
    };

    const handleDragStart = (e: React.DragEvent, task: any) => {
        e.dataTransfer.setData("taskId", task.id.toString());
        setActiveTaskId(task.id);
        // Set drag image transparent or style it? Standard DnD is strict, but we can rely on React updates for the list.
    };

    const handleDragEnd = async () => {
        setActiveTaskId(null);
        await updateTaskOrder();
    };

    const handleDragOverTask = (e: React.DragEvent, targetTask: any) => {
        e.preventDefault();
        if (!activeTaskId || activeTaskId === targetTask.id) return;

        const activeTask = tasks.find(t => t.id === activeTaskId);
        if (!activeTask || activeTask.status_id !== targetTask.status_id) return;

        const newTasks = [...tasks];
        const activeIndex = newTasks.findIndex(t => t.id === activeTaskId);
        const targetIndex = newTasks.findIndex(t => t.id === targetTask.id);

        if (activeIndex !== -1 && targetIndex !== -1) {
            // Swap logic
            const [movedTask] = newTasks.splice(activeIndex, 1);
            newTasks.splice(targetIndex, 0, movedTask);
            setTasks(newTasks);
        }
    };

    const toggleExpand = (taskId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };


    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
    );

    return (
        <div className="relative space-y-8">

            {/* Grouped by Status */}
            <div className="bg-white border-x border-t border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="grid grid-cols-[48px_1fr_100px_140px_140px_140px_80px] bg-slate-50/50 px-4 py-3 text-[11px] font-black text-slate-600 tracking-[0.15em]">
                    <div></div>
                    <div className="px-2 font-black">Task</div>
                    <div className="px-2 font-black">Progress</div>
                    <div className="px-2 font-black">Assignee</div>
                    <div className="px-2 font-black">Creator</div>
                    <div className="px-2 font-black">Due Date</div>
                    <div className="px-2 text-right">Action</div>
                </div>
            </div>
            {statuses.map((status) => {
                const statusTasks = getTasksByStatus(status.id);

                return (
                    <div key={status.id} className="space-y-3">
                        {/* Status Header */}
                        <div className="flex items-center gap-3 px-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: status.color || '#cbd5e1' }}
                            />
                            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                                {status.name}
                            </h2>
                            <span className="text-sm font-bold text-slate-400">
                                {statusTasks.length}
                            </span>
                        </div>




                        <div
                            className="bg-white border border-slate-200 shadow-sm min-h-[100px]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                const taskId = e.dataTransfer.getData("taskId");
                                if (taskId) {
                                    const parsedTaskId = parseInt(taskId);
                                    // Only update if status changed
                                    const task = tasks.find(t => t.id === parsedTaskId);
                                    if (task && task.status_id !== status.id) {
                                        updateTaskStatus(parsedTaskId, status.id);
                                    }
                                    setActiveTaskId(null);
                                }
                            }}
                        >
                            <div className="divide-y divide-slate-50">
                                {statusTasks.map((task) => (
                                    <React.Fragment key={task.id}>
                                        <motion.div
                                            layout
                                            key={task.id}
                                            draggable
                                            onDragStart={(e: any) => handleDragStart(e, task)}
                                            onDragOver={(e: any) => handleDragOverTask(e, task)}
                                            onDragEnd={handleDragEnd}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className={`grid grid-cols-[48px_1fr_100px_140px_140px_140px_80px] items-center px-4 py-4 hover:bg-slate-50/50 transition-colors group cursor-pointer bg-white border-b border-transparent ${activeTaskId === task.id ? 'opacity-30 bg-slate-50' : ''}`}
                                            onClick={() => openTaskDetails(task)}
                                        >
                                            <div className="flex items-center justify-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-900 transition-colors">
                                                <GripVertical size={18} />
                                            </div>
                                            <div className="px-2 pr-4 min-w-0 flex items-center gap-3">
                                                {/* Expand/Collapse Toggle */}
                                                {task.subtasks && task.subtasks.length > 0 ? (
                                                    <button
                                                        onClick={(e) => toggleExpand(task.id, e)}
                                                        className="p-0.5 rounded-md hover:bg-slate-200 text-slate-400 transition-colors"
                                                    >
                                                        <ChevronRight
                                                            size={16}
                                                            className={`transform transition-transform duration-200 ${expandedTasks.has(task.id) ? 'rotate-90' : ''}`}
                                                        />
                                                    </button>
                                                ) : (
                                                    <div className="w-[20px]" /> // Spacer
                                                )}

                                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                                    <div className="font-bold text-slate-900 text-sm truncate">{task.title}</div>
                                                    {(task.subtasks_count > 0 || task.comments_count > 0) && (
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            {task.subtasks_count > 0 && (
                                                                <div
                                                                    className="flex items-center gap-1 text-slate-400"
                                                                    title={`${task.subtasks_count} Subtasks`}
                                                                >
                                                                    <ListTodo size={15} />
                                                                    <span className="text-[11px] font-bold">{task.subtasks_count}</span>
                                                                </div>
                                                            )}
                                                            {task.comments_count > 0 && (
                                                                <div
                                                                    className="flex items-center gap-1 text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); openTaskDetails(task, 'comments'); }}
                                                                    title={`${task.comments_count} Comments`}
                                                                >
                                                                    <MessageSquare size={15} />
                                                                    <span className="text-[11px] font-bold">{task.comments_count}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-2">
                                                {/* Progress Bar */}
                                                <div className="flex flex-col gap-1.5 w-full">
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full transition-all"
                                                            style={{
                                                                width: `${Math.min(100, Math.max(0, ((parseFloat(task.actual_hours || 0)) / (parseFloat(task.estimated_hours || 1))) * 100))}%`
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="text-[10px] font-bold text-center text-blue-600">
                                                        {Math.round(((parseFloat(task.actual_hours || 0)) / (parseFloat(task.estimated_hours || 1))) * 100) || 0}%
                                                    </div>
                                                </div>
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
                                        </motion.div>

                                        {/* Subtasks */}
                                        <AnimatePresence>
                                            {
                                                expandedTasks.has(task.id) && task.subtasks && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden bg-slate-50/30"
                                                    >
                                                        {task.subtasks.map((subtask: any) => (
                                                            <div
                                                                key={subtask.id}
                                                                className="grid grid-cols-[48px_1fr_100px_140px_140px_140px_80px] items-center px-4 py-3 border-t border-slate-100/50 hover:bg-slate-50 transition-colors cursor-pointer"
                                                                onClick={() => openTaskDetails(subtask)}
                                                            >
                                                                <div className="flex justify-center">
                                                                    <CornerDownRight size={14} className="text-slate-300" />
                                                                </div>
                                                                <div className="px-2 pr-4 pl-4 font-medium text-slate-700 text-sm truncate relative">
                                                                    {subtask.title}
                                                                </div>
                                                                <div className="px-2">
                                                                    {/* Empty progress column for subtasks */}
                                                                </div>
                                                                <div className="px-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <UserIcon size={12} className="text-slate-400" />
                                                                        <span className="text-xs text-slate-500 truncate">{subtask.assignee?.name || 'Unassigned'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="px-2"></div>
                                                                <div className="px-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Clock size={12} className="text-slate-400" />
                                                                        <span className="text-[10px] text-slate-500">{subtask.due_date ? new Date(subtask.due_date).toLocaleDateString() : '--'}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="px-2 text-right">
                                                                    <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${subtask.status?.name === 'Done' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                                                        }`}>
                                                                        {subtask.status?.name}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )
                                            }
                                        </AnimatePresence>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div >
                );
            })}

            {/* Empty State */}
            {
                tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-4">
                        <CheckCircle2 size={48} strokeWidth={1} className="text-slate-200" />
                        <p className="text-sm font-medium">No tasks found. Start by creating a new one!</p>
                    </div>
                )
            }

            <TaskDetailSidebar
                taskId={selectedTaskId}
                projectId={projectId as string}
                isOpen={isSidebarOpen}
                onClose={handleCloseSidebar}
                onUpdate={fetchData}
                initialTab={sidebarTab}
            />
        </div >
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
