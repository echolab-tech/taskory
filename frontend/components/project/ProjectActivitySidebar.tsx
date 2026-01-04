"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, Activity, FileText, User } from "lucide-react";
import api from "@/app/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface ProjectActivitySidebarProps {
    projectId: string | number;
    isOpen: boolean;
    onClose: () => void;
    onSelectTask: (taskId: string | number) => void;
}

export default function ProjectActivitySidebar({
    projectId,
    isOpen,
    onClose,
    onSelectTask
}: ProjectActivitySidebarProps) {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchActivities(1);
            setPage(1);
        } else {
            setActivities([]);
        }
    }, [isOpen, projectId]);

    const fetchActivities = async (pageNum: number) => {
        setLoading(true);
        try {
            const res = await api.get(`/projects/${projectId}/activities?page=${pageNum}`);
            const newActivities = res.data.data.data;
            if (pageNum === 1) {
                setActivities(newActivities);
            } else {
                setActivities(prev => [...prev, ...newActivities]);
            }
            setHasMore(!!res.data.data.next_page_url);
        } catch (err) {
            console.error("Failed to fetch activities", err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchActivities(nextPage);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            loadMore();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[150]"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-[160] border-l border-slate-100 flex flex-col"
                    >
                        {/* Header */}
                        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-slate-900 font-black">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                    <Activity size={18} />
                                </div>
                                <span className="tracking-tight">Project Activity</span>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content */}
                        <div
                            className="flex-1 overflow-y-auto p-6 space-y-6"
                            onScroll={handleScroll}
                        >
                            {activities.map((activity, index) => (
                                <div key={`${activity.id}-${index}`} className="flex gap-4 group">
                                    {/* Timeline Line */}
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                            {activity.user?.name ? (
                                                <span className="text-[10px] font-black text-slate-600">{activity.user.name[0].toUpperCase()}</span>
                                            ) : (
                                                <User size={14} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div className="w-px h-full bg-slate-100 my-2 group-last:hidden" />
                                    </div>
                                    <div className="flex-1 min-w-0 pb-6">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="text-xs font-bold text-slate-900">{activity.user?.name || "Unknown User"}</span>
                                            <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                                                {new Date(activity.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div
                                            className="text-xs text-slate-600 leading-relaxed mb-2 cursor-pointer hover:bg-slate-50 p-2 -ml-2 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                                            onClick={() => onSelectTask(activity.task_id)}
                                        >
                                            <span className="font-semibold text-blue-600 hover:underline mr-1 block mb-1">
                                                {activity.task?.title || "Unknown Task"}
                                            </span>
                                            <span dangerouslySetInnerHTML={{ __html: formatActivityMessage(activity) }} />
                                            {activity.action === 'comment' && activity.new_value?.content && (
                                                <div className="mt-2 text-slate-500 italic border-l-2 border-slate-200 pl-2 line-clamp-2 text-[11px]">
                                                    "{stripTags(activity.new_value.content)}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-center py-4">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
                                </div>
                            )}
                            {!loading && activities.length === 0 && (
                                <div className="text-center py-10 text-slate-400">
                                    <Activity size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs font-medium">No activity recorded yet</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function formatActivityMessage(activity: any) {
    const action = activity.action;
    switch (action) {
        case 'created':
            return `created this task`;
        case 'updated':
            // Logic to check what field updated
            if (activity.old_value && activity.new_value) {
                // Determine changed keys
                const keys = Object.keys(activity.new_value);
                if (keys.includes('status_id')) return `changed status`;
                if (keys.includes('priority')) return `changed priority`;
                if (keys.includes('assignee_id')) return `changed assignee`;
                // Add more logic as needed
                return `updated the task`;
            }
            return `updated the task`;
        case 'comment':
            return `commented on the task`;
        case 'deleted':
            return `deleted the task`;
        default:
            return `performed action: ${action}`;
    }
}

function stripTags(html: string) {
    return html.replace(/<[^>]*>?/gm, '');
}
