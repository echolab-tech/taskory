
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    X,
    Trash2,
    Tag,
    TrendingUp,
    UserPlus,
    Flag,
    Calendar as CalendarIcon,
    AlignLeft,
    CheckCircle2,
    Plus,
    MessageSquare,
    Paperclip,
    Send,
    FileText,
    Save,
    DownloadCloud,
    AtSign,
    Maximize2
} from "lucide-react";
import api from "@/app/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import RichTextEditor, { RichTextEditorRef } from "@/components/ui/RichTextEditor";

interface TaskDetailSidebarProps {
    taskId: string | number | null;
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void; // Refresh parent list
    initialTab?: 'details' | 'comments' | 'subtasks';
}

export default function TaskDetailSidebar({
    taskId,
    projectId,
    isOpen,
    onClose,
    onUpdate,
    initialTab = 'details'
}: TaskDetailSidebarProps) {
    const { orgId } = useParams();
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Meta Data
    const [statuses, setStatuses] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // Form / State
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

    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Feature: Mentions
    const [showMentionList, setShowMentionList] = useState(false);
    const editorRef = useRef<RichTextEditorRef>(null);

    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const commentsRef = useRef<HTMLDivElement>(null);
    const subtasksRef = useRef<HTMLDivElement>(null);

    const isCreating = taskId === 'new';

    useEffect(() => {
        if (isOpen && projectId) {
            fetchMeta();
        }
    }, [isOpen, projectId]);

    useEffect(() => {
        if (isOpen) {
            if (taskId && taskId !== 'new') {
                fetchTaskDetails(taskId.toString());
                fetchActivities(taskId.toString());
            } else if (taskId === 'new') {
                resetFormForCreate();
            }
        }
    }, [taskId, isOpen]);

    const [currentUser, setCurrentUser] = useState<any>(null);

    // Handle initial scrolling
    useEffect(() => {
        if (isOpen && !loading && selectedTask) {
            if (initialTab === 'comments') {
                setTimeout(() => commentsRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
            } else if (initialTab === 'subtasks') {
                setTimeout(() => subtasksRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
            }
        }
    }, [isOpen, loading, initialTab, selectedTask]);

    useEffect(() => {
        const main = document.querySelector('main');
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (main) main.style.overflow = 'hidden';
            fetchCurrentUser();
        } else {
            document.body.style.overflow = 'unset';
            if (main) main.style.overflow = 'auto'; // Restore to auto or whatever it was
        }
        return () => {
            document.body.style.overflow = 'unset';
            if (main) main.style.overflow = 'auto';
        };
    }, [isOpen]);

    const fetchCurrentUser = async () => {
        try {
            const res = await api.get('/me');
            setCurrentUser(res.data.data);
        } catch (err) {
            console.error("Error fetching user", err);
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

    const fetchTaskDetails = async (id: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/tasks/${id}`);
            const task = res.data.data;
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
        } catch (err) {
            console.error("Error fetching task details", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async (id: string) => {
        try {
            const res = await api.get(`/tasks/${id}/comments`);
            setComments(res.data.data || []);
        } catch (err) {
            console.error("Error fetching comments", err);
        }
    };

    const resetFormForCreate = () => {
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
        setComments([]);
        setAttachments([]);
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            if (!isCreating && selectedTask) {
                setAutoSaving(true);
                if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

                autoSaveTimeoutRef.current = setTimeout(async () => {
                    try {
                        await api.put(`/tasks/${selectedTask.id}`, newData);
                        onUpdate();
                        setAutoSaving(false);
                        fetchActivities(selectedTask.id);
                    } catch (err) {
                        console.error("Auto-save failed", err);
                        setAutoSaving(false);
                    }
                }, 1000);
            }
            return newData;
        });
    };

    const handleSaveTask = async () => {
        if (!formData.title.trim()) return alert("Title required");
        try {
            await api.post('/tasks', { ...formData, project_id: projectId });
            onUpdate();
            onClose();
        } catch (err) {
            console.error("Error creating task", err);
        }
    };

    const handleDeleteTask = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDeleteTask = async () => {
        try {
            await api.delete(`/tasks/${selectedTask.id}`);
            onUpdate();
            onClose();
        } catch (err) {
            console.error("Error deleting task", err);
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() && attachments.length === 0) return;
        try {
            const data = new FormData();
            data.append('content', newComment);
            attachments.forEach((file) => data.append('files[]', file));

            setIsUploading(true);
            await api.post(`/tasks/${selectedTask.id}/comments`, data);

            setNewComment("");
            setAttachments([]);
            fetchActivities(selectedTask.id);
            onUpdate(); // Update counts
        } catch (err) {
            console.error("Error posting comment", err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return;
        try {
            await api.delete(`/comments/${commentId}`);
            fetchActivities(selectedTask.id);
            onUpdate();
        } catch (err) {
            console.error("Failed to delete comment", err);
        }
    };

    const handleDeleteFile = async (fileId: number) => {
        if (!confirm("Delete this file?")) return;
        try {
            await api.delete(`/attachments/${fileId}`);
            fetchTaskDetails(selectedTask.id); // Refresh to update attachment list
        } catch (err) {
            console.error("Failed to delete file", err);
        }
    };

    const handleDownloadFile = async (fileId: number, fileName: string) => {
        try {
            const response = await api.get(`/attachments/${fileId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    // Recursive open logic for parent/subtask navigation
    // Since we are inside the component, we can't easily change the parent prop 'taskId'.
    // BUT we can use internal state to override what we show, OR better, 
    // ask the parent to switch the task.
    // However, the cleanest way is for the component to just "be" the sidebar.
    // If we want to navigate, we probably need a callback prop to `onNavigate(newTaskId)`.

    // For now, let's implement navigation by just fetching the new task data into local state
    // effectively hijacking the view. 
    // Ideally we should call a prop like `onNavigate` so the URL/parent state updates too.
    // I'll add `onNavigate` prop? No, let's just use internal navigation for simplicity 
    // and rely on `taskId` prop changes for external control.
    // If user clicks a subtask, we update `selectedTask`.

    const handleTaskNavigation = (newId: string) => {
        // Fetch new task
        fetchTaskDetails(newId);
        fetchActivities(newId);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="sidebar"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 h-[calc(100dvh-4rem)] w-full max-w-xl bg-white shadow-2xl z-[101] border-l border-slate-200 flex flex-col"
                >
                    {/* Header */}
                    <div className="h-20 flex items-center justify-between px-8 bg-slate-50 border-b border-slate-200 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <h3 className="font-black text-slate-900 tracking-widest text-sm">
                                {isCreating ? "Initialize New Task" : "Task Quick View"}
                            </h3>
                            {!isCreating && (
                                <>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition-colors ${autoSaving ? "text-blue-600 bg-blue-50" : "text-emerald-600 bg-emerald-50"
                                        }`}>
                                        {autoSaving ? "Saving..." : "All Changes Saved"}
                                    </span>
                                    <Link
                                        href={`/${orgId}/project/${projectId}/tasks?taskId=${taskId}&full=true`} // Assuming query param or dedicated route
                                        /* Or simpler: just link to a dedicated page if it existed, but here we can simulate "Full View" by potentially opening a new page or expanding. 
                                          For now, let's assume valid route is /.../tasks/[taskId] or query param. 
                                          Actually, the user asked for "View Full Task", likely meaning navigating to a dedicated page layout.
                                          Let's link to the same view but maybe different mode, OR simpler: just open in new tab or navigate.
                                        */
                                        target="_blank"
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Open Full Page"
                                    >
                                        <Maximize2 size={16} />
                                    </Link>
                                </>
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
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-white">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="p-8 space-y-6">
                                {/* Parent Task Link */}
                                {!isCreating && selectedTask?.parent && (
                                    <div
                                        className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 transition-colors bg-slate-50 w-fit px-2 py-1 rounded-lg border border-slate-100 mb-4"
                                        onClick={() => handleTaskNavigation(selectedTask.parent.id)}
                                    >
                                        <TrendingUp className="rotate-90" size={12} />
                                        Parent: {selectedTask.parent.title}
                                    </div>
                                )}

                                {/* Title Input */}
                                <input
                                    type="text"
                                    required
                                    className="w-full text-lg font-black text-slate-900 placeholder:text-slate-200 border-none focus:ring-0 p-0 bg-transparent"
                                    placeholder="Task Title..."
                                    value={formData.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                />

                                {/* Fields Grid */}
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Tag size={12} /> Status</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none" value={formData.status_id} onChange={(e) => updateField('status_id', e.target.value)}>
                                            {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            <option value="">No Status</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={12} /> Priority</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none" value={formData.priority} onChange={(e) => updateField('priority', e.target.value)}>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><UserPlus size={12} /> Assignee</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none" value={formData.assignee_id} onChange={(e) => updateField('assignee_id', e.target.value)}>
                                            <option value="">Unassigned</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Flag size={12} /> Milestone</label>
                                        <select className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none" value={formData.milestone_id} onChange={(e) => updateField('milestone_id', e.target.value)}>
                                            <option value="">No Milestone</option>
                                            {milestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><CalendarIcon size={12} /> Start Date</label>
                                        <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700" value={formData.start_date} onChange={(e) => updateField('start_date', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><CalendarIcon size={12} /> Due Date</label>
                                        <input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-700" value={formData.due_date} onChange={(e) => updateField('due_date', e.target.value)} />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2 pt-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><AlignLeft size={12} /> Description</label>
                                    <RichTextEditor
                                        key={selectedTask?.id || 'new'}
                                        value={formData.description || ""}
                                        onChange={(val) => updateField('description', val)}
                                        placeholder="Add a more detailed description..."
                                        minHeight="300px"
                                    />
                                </div>

                                {/* Subtasks */}
                                {!isCreating && (
                                    <div ref={subtasksRef} className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={12} /> Subtasks</h4>
                                        <div className="space-y-2">
                                            {selectedTask?.subtasks && selectedTask.subtasks.map((sub: any) => (
                                                <div key={sub.id} onClick={() => handleTaskNavigation(sub.id)} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${sub.status?.name === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                                        {sub.status?.name === 'Completed' && <CheckCircle2 size={10} className="text-white" />}
                                                    </div>
                                                    <span className={`text-xs font-bold ${sub.status?.name === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{sub.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 flex items-center justify-center"><Plus size={14} className="text-slate-400" /></div>
                                            <input type="text" className="flex-1 bg-transparent border-none text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:ring-0 p-0" placeholder="Add a subtask..." onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (!val.trim()) return;
                                                    await api.post('/tasks', { project_id: projectId, title: val, parent_id: selectedTask.id, priority: 'medium' });
                                                    (e.target as HTMLInputElement).value = "";
                                                    fetchTaskDetails(selectedTask.id);
                                                    onUpdate();
                                                }
                                            }} />
                                        </div>
                                    </div>
                                )}

                                {/* Attachments Section */}
                                {!isCreating && (
                                    <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Paperclip size={12} />
                                            Attachments
                                        </h4>

                                        {selectedTask?.attachments && selectedTask.attachments.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {selectedTask.attachments.map((file: any) => (
                                                    <div
                                                        key={file.id}
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group relative"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-[10px] font-bold text-slate-700 truncate" title={file.file_name}>
                                                                {file.file_name}
                                                            </div>
                                                            <div className="text-[9px] font-medium text-slate-400">
                                                                {(file.file_size / 1024).toFixed(1)} KB
                                                            </div>
                                                        </div>
                                                        {/* Buttons */}
                                                        <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDownloadFile(file.id, file.file_name); }}
                                                                className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50"
                                                                title="Download"
                                                            >
                                                                <DownloadCloud size={14} />
                                                            </button>
                                                            {file.user_id === currentUser?.id && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                                                                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50"
                                                                    title="Delete for everyone"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs italic text-slate-400 py-2">No files attached</p>
                                        )}
                                    </div>
                                )}

                                {/* Comments */}
                                {!isCreating && (
                                    <div ref={commentsRef} className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={12} /> Activity & Comments</h4>
                                        {comments.length === 0 ? <p className="text-xs italic text-slate-400 text-center py-4">No activity yet</p> : (
                                            <div className="space-y-6">
                                                {comments.map((activity) => (
                                                    <div key={activity.id} className="flex gap-3 group">
                                                        <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{activity.user?.name?.[0].toUpperCase()}</div>
                                                        <div className="space-y-1 flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Link href={`/${orgId}/members/${activity.user?.id}`} className="text-[11px] font-bold text-slate-900 hover:text-blue-600 hover:underline">
                                                                        {activity.user?.name}
                                                                    </Link>
                                                                    <span className="text-[9px] font-medium text-slate-400">{new Date(activity.created_at).toLocaleString()}</span>
                                                                </div>
                                                                {/* Only show delete for actual comments (usually type isn't 'activity') and if owner */}
                                                                {activity.type !== 'activity' && activity.user?.id === currentUser?.id && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(activity.id)}
                                                                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all p-1"
                                                                        title="Delete comment"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {activity.content && (
                                                                <div
                                                                    className="text-[11px] leading-relaxed text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-50 prose prose-xs prose-slate max-w-none [&>p]:mb-0 [&>p]:leading-relaxed"
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: activity.content.replace(
                                                                            /@(\w+)/g,
                                                                            (match: string, username: string) => {
                                                                                // Find user by name to get ID (optional optimization: map names to IDs beforehand)
                                                                                const user = users.find(u => u.name === username);
                                                                                const link = user ? `/${orgId}/members/${user.id}` : '#';
                                                                                return `<a href="${link}" class="text-blue-600 font-bold hover:underline">${match}</a>`;
                                                                            }
                                                                        )
                                                                    }}
                                                                />
                                                            )}
                                                            {activity.file_url && <a href={activity.file_url} target="_blank" className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-300 w-fit"><FileText size={12} className="text-blue-500" /><span className="text-[10px] font-bold text-slate-700 truncate">{activity.file_name}</span></a>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Input */}
                    {!isCreating && (
                        <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 z-10">
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-400 shadow-sm transition-all relative">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNewComment(val);
                                        if (val.endsWith('@')) {
                                            setShowMentionList(true);
                                        } else if (!val.includes('@')) { // Simple check to hide if deleted
                                            setShowMentionList(false);
                                        }
                                    }}
                                    className="w-full border-none shadow-none rounded-none bg-transparent p-4 min-h-[80px] focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400 resize-none"
                                    placeholder="Type a comment... (use @ to mention)"
                                />

                                {/* Mention List Popover */}
                                {showMentionList && (
                                    <div className="absolute bottom-12 left-2 bg-white rounded-xl shadow-xl border border-slate-200 w-64 max-h-48 overflow-y-auto overflow-x-hidden z-20 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            Mention Member
                                        </div>
                                        <div className="p-1">
                                            {users.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => {
                                                        setNewComment(prev => prev + `${u.name} `); // Append name to @
                                                        setShowMentionList(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors text-left group"
                                                >
                                                    <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                                        {u.name[0].toUpperCase()}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 truncate">{u.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {attachments.length > 0 && (
                                    <div className="px-3 pt-2 flex flex-wrap gap-2 border-t border-slate-50">
                                        {attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold border border-blue-100">
                                                <Paperclip size={10} />
                                                <span className="max-w-[100px] truncate">{file.name}</span>
                                                <button onClick={() => setAttachments(p => p.filter((_, i) => i !== idx))}><X size={10} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-2 bg-slate-50/50 border-t border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <label className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors" title="Attach file">
                                            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                            <Paperclip size={16} />
                                        </label>
                                    </div>
                                    <button
                                        onClick={handlePostComment}
                                        disabled={(!newComment || newComment.trim() === '') && !attachments.length}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-xs font-bold transition-colors flex items-center gap-2"
                                    >
                                        {isUploading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Send</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create Footer */}
                    {isCreating && (
                        <div className="p-8 bg-white border-t border-slate-100 flex gap-4 flex-shrink-0">
                            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black tracking-widest hover:bg-slate-100">Discard</button>
                            <button onClick={handleSaveTask} className="flex-[2] px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black tracking-[0.2em] hover:bg-black shadow-xl"><Save size={16} /> Add Task</button>
                        </div>
                    )}
                </motion.div>
            )}




            {/* Delete Confirmation Dialog */}
            {
                showDeleteConfirm && (

                    <motion.div
                        key="delete-dialog"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteConfirm(false)}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
                        >
                            <div className="p-6 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">Delete Task?</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                    Are you sure you want to delete <span className="font-bold text-slate-700">"{selectedTask?.title}"</span>? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteTask}
                                        className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                )}
        </AnimatePresence>
    );
}

