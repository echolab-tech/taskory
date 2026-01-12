"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    User as UserIcon,
    Clock,
    Sparkles,
    AlertCircle,
    Loader2
} from "lucide-react";
import api from "@/app/lib/api";
import { motion } from "framer-motion";
import TaskDetailSidebar from "@/components/task/TaskDetailSidebar";

const DAY_WIDTH = 40; // width of one day in pixels

export default function GanttChartPage() {
    const { projectId } = useParams();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date());
    const [isDragging, setIsDragging] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Sidebar State
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'details' | 'comments' | 'subtasks'>('details');

    // Timeline range: display 30 days before and 60 days after viewDate
    const timelineDays = useMemo(() => {
        const days = [];
        const start = new Date(viewDate);
        start.setDate(start.getDate() - 15); // Start 15 days ago

        for (let i = 0; i < 60; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }, [viewDate]);

    const startDate = timelineDays[0];
    const endDate = timelineDays[timelineDays.length - 1];

    const searchParams = useSearchParams();

    useEffect(() => {
        if (projectId) {
            fetchTasks();
        }
    }, [projectId, searchParams]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(searchParams.toString());
            params.set('project_id', projectId as string);

            const res = await api.get(`/tasks?${params.toString()}`);
            setTasks(res.data.data || []);
        } catch (err) {
            console.error("Error fetching tasks for Gantt", err);
        } finally {
            setLoading(false);
        }
    };

    const updateTaskDates = async (taskId: number, start: string, due: string) => {
        try {
            await api.patch(`/tasks/${taskId}`, {
                start_date: start,
                due_date: due
            });
            // Update local state is handled within the drag logic if possible, 
            // but we'll fetch or update state for safety
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, start_date: start, due_date: due } : t));
        } catch (err) {
            console.error("Failed to update task dates", err);
            fetchTasks(); // Revert on failure
        }
    };

    // Calculate position and width based on dates
    const getTaskStyles = (task: any) => {
        const taskStart = task.start_date ? new Date(task.start_date) : null;
        const taskDue = task.due_date ? new Date(task.due_date) : null;

        if (!taskStart || !taskDue) return null;

        const startDiff = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((taskDue.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return {
            left: startDiff * DAY_WIDTH,
            width: Math.max(duration * DAY_WIDTH, DAY_WIDTH),
        };
    };

    const handleDragEnd = (event: any, info: any, task: any) => {
        const deltaDays = Math.round(info.offset.x / DAY_WIDTH);
        if (deltaDays === 0) return;

        const currentStart = new Date(task.start_date || new Date());
        const currentDue = new Date(task.due_date || new Date());

        currentStart.setDate(currentStart.getDate() + deltaDays);
        currentDue.setDate(currentDue.getDate() + deltaDays);

        updateTaskDates(task.id, currentStart.toISOString().split('T')[0], currentDue.toISOString().split('T')[0]);
    };

    const handleResize = async (taskId: number, direction: 'start' | 'due', deltaX: number) => {
        const deltaDays = Math.round(deltaX / DAY_WIDTH);
        if (deltaDays === 0) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        let newStart = task.start_date;
        let newDue = task.due_date;

        if (direction === 'start') {
            const date = new Date(task.start_date);
            date.setDate(date.getDate() + deltaDays);
            // Don't allow start to exceed due
            if (date > new Date(task.due_date)) return;
            newStart = date.toISOString().split('T')[0];
        } else {
            const date = new Date(task.due_date);
            date.setDate(date.getDate() + deltaDays);
            // Don't allow due to be before start
            if (date < new Date(task.start_date)) return;
            newDue = date.toISOString().split('T')[0];
        }

        updateTaskDates(taskId, newStart, newDue);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const formatMonth = (date: Date) => {
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const openTaskDetails = (task: any) => {
        if (isDragging) return; // Prevent click when dragging
        setSelectedTaskId(task.id);
        setSidebarTab('details');
        setIsSidebarOpen(true);
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
        setSelectedTaskId(null);
        fetchTasks();
    };

    if (loading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-slate-500 font-medium italic">Constructing Timeline...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Gantt Header / Controls */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            const d = new Date(viewDate);
                            d.setDate(d.getDate() - 7);
                            setViewDate(d);
                        }}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                    >
                        <ChevronLeft size={18} className="text-slate-600" />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                        <CalendarIcon size={16} className="text-blue-500" />
                        <span className="text-sm font-bold text-slate-700">{formatMonth(viewDate)}</span>
                    </div>
                    <button
                        onClick={() => {
                            const d = new Date(viewDate);
                            d.setDate(d.getDate() + 7);
                            setViewDate(d);
                        }}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
                    >
                        <ChevronRight size={18} className="text-slate-600" />
                    </button>
                    <button
                        onClick={() => setViewDate(new Date())}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Active
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        Completed
                    </div>
                </div>
            </div>

            <div className="flex flex-1 min-h-[500px] overflow-hidden">
                {/* Left Side: Task Names */}
                <div className="w-64 border-r border-slate-100 flex-shrink-0 bg-white z-20">
                    <div className="h-12 border-b border-slate-100 flex items-center px-4 bg-slate-50/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks Overview</span>
                    </div>
                    <div className="flex flex-col divide-y divide-slate-50">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => openTaskDetails(task)}
                                className="h-[64px] flex items-center px-4 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-slate-900 truncate">{task.title}</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                            <UserIcon size={8} className="text-slate-400" />
                                        </div>
                                        <span className="text-[9px] font-medium text-slate-400 truncate">{task.assignee?.name || 'Unassigned'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic text-xs">No tasks available</div>
                        )}
                    </div>
                </div>

                {/* Right Side: Timeline Visualization */}
                <div className="flex-1 overflow-x-auto no-scrollbar relative" ref={scrollContainerRef}>
                    <div
                        className="relative"
                        style={{ width: timelineDays.length * DAY_WIDTH }}
                    >
                        {/* Timeline Header (Days) */}
                        <div className="h-12 flex border-b border-slate-100 sticky top-0 bg-white z-10 transition-all">
                            {timelineDays.map((day, idx) => (
                                <div
                                    key={idx}
                                    className={`w-[40px] flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-50/50 ${isToday(day) ? 'bg-blue-50/30' : ''}`}
                                >
                                    <span className={`text-[9px] font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-400'}`}>
                                        {day.getDate()}
                                    </span>
                                    <span className={`text-[8px] font-medium uppercase mt-0.5 ${isToday(day) ? 'text-blue-400' : 'text-slate-300'}`}>
                                        {day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Grid Lines Overlay */}
                        <div className="absolute top-12 left-0 right-0 bottom-0 pointer-events-none">
                            {timelineDays.map((day, idx) => (
                                <div
                                    key={idx}
                                    className={`absolute top-0 bottom-0 w-[1px] ${isToday(day) ? 'bg-blue-200/50 z-0' : 'bg-slate-50/80'}`}
                                    style={{ left: idx * DAY_WIDTH }}
                                />
                            ))}
                        </div>

                        {/* Task Bars */}
                        <div className="flex flex-col divide-y divide-slate-50 relative z-10">
                            {tasks.map((task) => {
                                const styles = getTaskStyles(task);
                                const isCompleted = task.status?.name === 'Completed';

                                return (
                                    <div key={task.id} className="h-[64px] relative flex items-center">
                                        {styles ? (
                                            <motion.div
                                                drag="x"
                                                dragConstraints={scrollContainerRef}
                                                dragElastic={0}
                                                dragMomentum={false}
                                                onDragStart={() => setIsDragging(true)}
                                                onDragEnd={(e, info) => {
                                                    setIsDragging(false);
                                                    handleDragEnd(e, info, task);
                                                }}
                                                // Only open details if not dragging; checked in openTaskDetails but motion has its own behavior.
                                                // We can use onTap instead of onClick to be safer with framer motion, 
                                                // or just standard onClick which usually fires if drag didn't happen.
                                                onClick={() => openTaskDetails(task)}
                                                style={{
                                                    ...styles,
                                                    position: 'absolute',
                                                    backgroundColor: `${task.status?.color || '#3b82f6'}33`,
                                                    borderColor: `${task.status?.color || '#3b82f6'}66`,
                                                    color: task.status?.color || '#3b82f6'
                                                }}
                                                className="h-8 rounded-xl shadow-sm flex items-center px-3 cursor-grab active:cursor-grabbing group/bar border transition-colors"
                                            >
                                                {/* Start Resize Handle */}
                                                <motion.div
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0 }}
                                                    dragElastic={0}
                                                    onDragEnd={(e, info) => handleResize(task.id, 'start', info.offset.x)}
                                                    // Stop propagation so we don't open details when resizing
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-l-xl opacity-0 group-hover/bar:opacity-100 transition-opacity z-20"
                                                />

                                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                    <Sparkles size={10} className={`shrink-0 ${isCompleted ? 'opacity-50' : 'animate-pulse'}`} />
                                                    <span className="text-[10px] font-black truncate leading-none">
                                                        {task.title}
                                                    </span>
                                                </div>

                                                {/* Due Resize Handle */}
                                                <motion.div
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0 }}
                                                    dragElastic={0}
                                                    onDragEnd={(e, info) => handleResize(task.id, 'due', info.offset.x)}
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-r-xl opacity-0 group-hover/bar:opacity-100 transition-opacity z-20"
                                                />
                                            </motion.div>
                                        ) : (
                                            <div className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 border-dashed rounded-lg">
                                                <AlertCircle size={10} className="text-slate-400" />
                                                <span className="text-[9px] font-bold text-slate-400 italic">No dates defined</span>
                                                <button className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase ml-2">Set Schedule</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hint Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 italic">Pro-tip: Drag bars horizontally to reschedule tasks across the timeline.</span>
                </div>
                <div className="text-[10px] font-black text-slate-300">Gantt View v1.0</div>
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
