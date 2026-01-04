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
    Sparkles,
    Send,
    Paperclip,
    FileText,
    MessageSquare
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

    // Sidebar View State
    const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            const [statusRes, milestoneRes, projectUsersRes] = await Promise.all([
                api.get(`/task-statuses?project_id=${projectId}`),
                api.get(`/milestones?project_id=${projectId}`),
                api.get(`/projects/${projectId}/users`)
            ]);
            setStatuses(statusRes.data.data || []);
            setMilestones(milestoneRes.data.data || []);
            setUsers(projectUsersRes.data.data || []);
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

    const fetchActivities = async (taskId: string) => {
        try {
            // endpoint switched to /comments as /activities was not found
            // This should return the list of comments/interactions for the task
            const res = await api.get(`/tasks/${taskId}/comments`);
            setComments(res.data.data || []);
        } catch (err) {
            console.error("Error fetching comments", err);
            setComments([]);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Trigger Auto-Save if editing existing task
            if (!isCreating && selectedTask) {
                setAutoSaving(true);
                if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

                autoSaveTimeoutRef.current = setTimeout(async () => {
                    try {
                        await api.put(`/tasks/${selectedTask.id}`, newData);
                        fetchTasks(); // Refresh list silently
                        setAutoSaving(false);
                        fetchActivities(selectedTask.id); // Refresh activity feed
                    } catch (err) {
                        console.error("Auto-save failed", err);
                        setAutoSaving(false);
                    }
                }, 1000);
            }

            return newData;
        });
    };

    const handlePostComment = async () => {
        if (!newComment.trim() && attachments.length === 0) return;

        try {
            const data = new FormData();
            data.append('content', newComment);
            attachments.forEach((file) => {
                data.append('files[]', file); // Use 'files[]' convention for arrays in PHP/Laravel backends often
            });

            // Or if strict JSON is expected for components without files, handle accordingly.
            // But FormData is safest for files.

            setIsUploading(true);
            await api.post(`/tasks/${selectedTask.id}/comments`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setNewComment("");
            setAttachments([]);
            fetchActivities(selectedTask.id);
        } catch (err) {
            console.error("Error posting comment", err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Convert FileList to Array and append
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
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

        // Reset sidebar view state
        setActiveTab('details');
        setComments([]);
        setAttachments([]);
        setNewComment("");

        // Fetch user activities/comments
        fetchActivities(task.id);

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
        setActiveTab('details');
        setComments([]);
        setAttachments([]);
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
                fetchTasks();
                handleCloseSidebar();
            } else {
                // Manual save trigger (if needed, though auto-save handles it)
                await api.put(`/tasks/${selectedTask.id}`, formData);
                fetchTasks();
                // Don't close sidebar on manual save in edit mode, just notify? 
                // Actually, if this is called from the "Save" button which is now removed in Edit mode,
                // this block might technically be unreachable for Edit mode unless we re-add a button.
                // But let's keep it safe.
                setAutoSaving(false);
            }
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
                            <div className="h-20 flex items-center justify-between px-8 bg-slate-50 border-b border-slate-200 flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-black text-slate-900 tracking-widest text-sm">
                                        {isCreating ? "Initialize New Task" : "Task Quick View"}
                                    </h3>
                                    {!isCreating && (
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${autoSaving ? "text-blue-600 bg-blue-50" : "text-emerald-600 bg-emerald-50"
                                            }`}>
                                            {autoSaving ? "Saving..." : "All Changes Saved"}
                                        </span>
                                    )}
                                </div>
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

                            {/* Tabs (Only in Edit Mode) */}
                            {/* Tabs Removed - Unified View */}

                            {/* Panel Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto bg-white">
                                <div className="p-8 space-y-6">
                                    {/* Auto-Save Form - Compact Layout */}
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            required
                                            className="w-full text-lg font-black text-slate-900 placeholder:text-slate-200 border-none focus:ring-0 p-0 bg-transparent"
                                            placeholder="Task Title..."
                                            value={formData.title}
                                            onChange={(e) => updateField('title', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Tag size={12} /> Status
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none"
                                                value={formData.status_id}
                                                onChange={(e) => updateField('status_id', e.target.value)}
                                            >
                                                {statuses.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                                <option value="">No Status</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <TrendingUp size={12} /> Priority
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none"
                                                value={formData.priority}
                                                onChange={(e) => updateField('priority', e.target.value)}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <UserPlus size={12} /> Assignee
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none"
                                                value={formData.assignee_id}
                                                onChange={(e) => updateField('assignee_id', e.target.value)}
                                            >
                                                <option value="">Unassigned</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Flag size={12} /> Milestone
                                            </label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none"
                                                value={formData.milestone_id}
                                                onChange={(e) => updateField('milestone_id', e.target.value)}
                                            >
                                                <option value="">No Milestone</option>
                                                {milestones.map(m => (
                                                    <option key={m.id} value={m.id}>{m.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <CalendarIcon size={12} /> Start Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all ring-0"
                                                value={formData.start_date}
                                                onChange={(e) => updateField('start_date', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <CalendarIcon size={12} /> Due Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all ring-0"
                                                value={formData.due_date}
                                                onChange={(e) => updateField('due_date', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <AlignLeft size={12} /> Description
                                        </label>
                                        <textarea
                                            rows={12}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 transition-all resize-none leading-relaxed"
                                            placeholder="Add a more detailed description..."
                                            value={formData.description}
                                            onChange={(e) => updateField('description', e.target.value)}
                                        />
                                    </div>
                                    {/* Activity Timeline Section (Unified) */}
                                    {!isCreating && (
                                        <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <MessageSquare size={12} />
                                                Activity & Comments
                                            </h4>

                                            {comments.length === 0 ? (
                                                <p className="text-xs italic text-slate-400 text-center py-4">No activity yet</p>
                                            ) : (
                                                <div className="space-y-6">
                                                    {comments.map((activity) => (
                                                        <div key={activity.id} className="flex gap-3 group">
                                                            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">
                                                                {activity.user?.name?.substring(0, 1).toUpperCase() || "S"}
                                                            </div>
                                                            <div className="space-y-1 flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] font-bold text-slate-900">{activity.user?.name || "System"}</span>
                                                                    <span className="text-[9px] font-medium text-slate-400">{activity.created_at ? new Date(activity.created_at).toLocaleString() : "Just now"}</span>
                                                                </div>

                                                                {activity.content && (
                                                                    <div className={`text-[11px] leading-relaxed ${activity.type === 'activity' ? 'text-slate-500 italic' : 'text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-50'}`}>
                                                                        {activity.content}
                                                                    </div>
                                                                )}

                                                                {activity.file_url && (
                                                                    <a href={activity.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-300 w-fit max-w-full">
                                                                        <FileText size={12} className="text-blue-500" />
                                                                        <span className="text-[10px] font-bold text-slate-700 truncate max-w-[150px]">{activity.file_name}</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Comment Input Footer (Fixed at Bottom for Edit Mode) */}
                            {!isCreating && (
                                <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 z-10">
                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {attachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-100 animate-in slide-in-from-bottom-2">
                                                    <Paperclip size={10} />
                                                    <span className="max-w-[100px] truncate">{file.name}</span>
                                                    <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="hover:text-rose-500"><X size={10} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-400 transition-all">
                                        <label className="p-1.5 text-slate-400 hover:text-blue-600 cursor-pointer flex-shrink-0">
                                            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                            <Paperclip size={16} />
                                        </label>
                                        <textarea
                                            className="flex-1 bg-transparent border-none p-1.5 text-xs text-slate-700 focus:ring-0 resize-none max-h-24 min-h-[36px]"
                                            placeholder="Type a comment..."
                                            rows={1}
                                            value={newComment}
                                            onChange={(e) => {
                                                setNewComment(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); }
                                            }}
                                        />
                                        <button onClick={handlePostComment} disabled={!newComment.trim() && attachments.length === 0} className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex-shrink-0">
                                            {isUploading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={14} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Panel Footer (Only for Create Mode) */}
                            {isCreating && (
                                <div className="p-8 bg-white border-t border-slate-100 flex gap-4 flex-shrink-0">
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
                                        Add Task
                                    </button>
                                </div>
                            )}
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
