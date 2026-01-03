"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Clock,
    User as UserIcon,
    MoreHorizontal,
    GripVertical,
    X,
    Calendar as CalendarIcon,
    AlignLeft,
    Tag,
    UserPlus,
    Plus,
    TrendingUp,
    CheckCircle2,
    Trash2,
    Save,
    Flag,
    Sparkles
} from "lucide-react";
import api from "@/app/lib/api";
import { Reorder, motion, AnimatePresence } from "framer-motion";

function TasksListContent() {
    const { orgId, projectId } = useParams();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form state for creating/editing
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status_id: "",
        assignee_id: "",
        milestone_id: "",
        due_date: "",
        start_date: "",
        priority: "medium"
    });

    const [statuses, setStatuses] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

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
            fetchMeta();
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

    const fetchMeta = async () => {
        try {
            const [statusRes, milestoneRes, orgRes] = await Promise.all([
                api.get(`/task-statuses?project_id=${projectId}`),
                api.get(`/milestones?project_id=${projectId}`),
                api.get(`/organizations/${orgId}`)
            ]);
            setStatuses(statusRes.data.data || []);
            setMilestones(milestoneRes.data.data || []);
            setUsers(orgRes.data.data.users || []);
        } catch (err) {
            console.error("Error fetching meta", err);
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

    const openTaskDetails = (task: any) => {
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description || "",
            status_id: task.status_id?.toString() || "",
            assignee_id: task.assignee_id?.toString() || "",
            milestone_id: task.milestone_id?.toString() || "",
            due_date: task.due_date || "",
            start_date: task.start_date || "",
            priority: task.priority || "medium"
        });
        setIsCreating(false);
        setIsSidebarOpen(true);
    };

    const openCreateTask = () => {
        setSelectedTask(null);
        setFormData({
            title: "",
            description: "",
            status_id: statuses[0]?.id?.toString() || "",
            assignee_id: "",
            milestone_id: "",
            due_date: "",
            start_date: "",
            priority: "medium"
        });
        setIsCreating(true);
        setIsSidebarOpen(true);
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.title.trim()) {
            alert("Please enter a task title.");
            return;
        }

        try {
            if (isCreating) {
                await api.post('/tasks', { ...formData, project_id: projectId });
            } else {
                await api.put(`/tasks/${selectedTask.id}`, formData);
            }
            fetchTasks();
            handleCloseSidebar();
        } catch (err) {
            console.error("Error saving task", err);
        }
    };

    const handleDeleteTask = async () => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await api.delete(`/tasks/${selectedTask.id}`);
            fetchTasks();
            handleCloseSidebar();
        } catch (err) {
            console.error("Error deleting task", err);
        }
    };

    const handleCloseSidebar = () => {
        setIsSidebarOpen(false);
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
                                <div className="px-2 font-bold text-slate-900 text-sm truncate pr-4">
                                    {task.title}
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

            {/* SLIDE-OVER SIDEBAR */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseSidebar}
                            className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-[100]"
                        />
                        {/* Sidebar Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-screen w-full max-w-xl bg-white shadow-2xl z-[101] border-l border-slate-200 flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="h-20 flex items-center justify-between px-8 bg-slate-50 border-b border-slate-200">
                                <h3 className="font-black text-slate-900 tracking-widest text-sm">
                                    {isCreating ? "Initialize New Task" : "Task Intelligence"}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {!isCreating && (
                                        <button
                                            onClick={handleDeleteTask}
                                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleCloseSidebar}
                                        className="p-2 text-slate-400 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Panel Form */}
                            <form onSubmit={handleSaveTask} className="flex-1 overflow-y-auto p-10 space-y-10">
                                {/* Title Input */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                        <AlignLeft size={14} />
                                        Task Designation
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full text-2xl font-black text-slate-950 placeholder:text-slate-200 border-none focus:ring-0 p-0"
                                        placeholder="Define the task objective..."
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                {/* Main Properties Grid */}
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Tag size={14} />
                                            Lifecycle Status
                                        </label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-900 transition-all appearance-none"
                                            value={formData.status_id}
                                            onChange={(e) => setFormData({ ...formData, status_id: e.target.value })}
                                        >
                                            {statuses.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                            <option value="">No Status</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                            <TrendingUp size={14} />
                                            Priority Level
                                        </label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-900 transition-all appearance-none"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option value="low">Low Priority</option>
                                            <option value="medium">Medium Priority</option>
                                            <option value="high">High Priority</option>
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                            <UserPlus size={14} />
                                            Operational Lead
                                        </label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-900 transition-all appearance-none"
                                            value={formData.assignee_id}
                                            onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                                        >
                                            <option value="">Unassigned</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                            <CalendarIcon size={14} />
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-900 transition-all ring-0"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                            <CalendarIcon size={14} />
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-900 transition-all ring-0"
                                            value={formData.due_date}
                                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-span-2 space-y-4">
                                        <label className="text-[10px] font-black text-slate-500 tracking-[0.2em] flex items-center gap-2">
                                            <Flag size={14} />
                                            Project Milestone
                                        </label>
                                        <select
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-slate-900 transition-all appearance-none"
                                            value={formData.milestone_id}
                                            onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })}
                                        >
                                            <option value="">No Milestone</option>
                                            {milestones.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                        <AlignLeft size={14} className="text-slate-400" />
                                        Task Documentation
                                    </label>
                                    <textarea
                                        rows={8}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-6 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-all resize-none italic"
                                        placeholder="Elaborate on the task details and specifications..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </form>

                            {/* Panel Footer */}
                            <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleCloseSidebar}
                                    className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black tracking-widest hover:bg-slate-100 transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSaveTask}
                                    className="flex-[2] px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black tracking-[0.2em] hover:bg-black shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <Save size={16} />
                                    {isCreating ? "Add Task" : "Save Changes"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function ProjectTasksListPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        }>
            <TasksListContent />
        </Suspense>
    );
}
