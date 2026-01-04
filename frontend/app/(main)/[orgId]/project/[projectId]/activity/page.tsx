"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from '@/app/lib/useAuth';
import api from "@/app/lib/api";
import { Bell, Activity as ActivityIcon, MessageCircle, FileText, User, Plus } from "lucide-react";

export default function ProjectActivityPage() {
    const { orgId, projectId } = useParams();
    const { user } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (projectId) {
            fetchActivities(1);
        }
    }, [projectId]);

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

    // Infinite scroll handler for the window
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                loadMore();
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, hasMore, page]);


    if (!user) return null;

    return (
        <div className="max-w-[1200px] mx-auto min-h-screen pb-20 space-y-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl text-indigo-600">
                    <ActivityIcon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Activity</h1>
                    <p className="text-slate-500 font-medium">Real-time updates and history for this project.</p>
                </div>
            </div>

            <div className="max-w-3xl">
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                    {activities.map((activity, index) => (
                        <div key={`${activity.id}-${index}`} className="relative flex items-start group">
                            {/* Icon/Timeline Dot */}
                            <div className="absolute left-0 md:left-0 mt-1 flex items-center justify-center bg-white rounded-full border-4 border-white">
                                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                    {getIconForActivity(activity)}
                                </div>
                            </div>

                            {/* Content Card */}
                            <div className="ml-16 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 hover:border-indigo-100 hover:shadow-md transition-all">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-900">{activity.user?.name || "Unknown User"}</span>
                                        <span className="text-slate-500 text-sm">
                                            {formatActivityMessage(activity)}
                                        </span>
                                        <span className="font-bold text-blue-600 hover:underline cursor-pointer" onClick={() => window.location.href = `/${orgId}/project/${projectId}/tasks?taskId=${activity.task_id}`}>
                                            {activity.task?.title || "Unknown Task"}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-lg">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </span>
                                </div>

                                {activity.action === 'comment' && activity.new_value?.content && (
                                    <div className="mt-3 text-slate-600 bg-slate-50 p-4 rounded-xl text-sm border border-slate-100 italic">
                                        "{stripTags(activity.new_value.content)}"
                                    </div>
                                )}

                                {/* Handle Field Updates (Action ends with _updated) */}
                                {activity.action.endsWith('_updated') && (
                                    <div className="mt-3 flex items-center gap-3 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="font-medium text-slate-500 min-w-[80px]">
                                            {activity.action.replace('_updated', '')}
                                        </div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="line-through text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                                {renderValue(activity.old_value)}
                                            </span>
                                            <span className="text-slate-400">→</span>
                                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                {renderValue(activity.new_value)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Handle Legacy/Generic Updates */}
                                {activity.action === 'updated' && activity.old_value && activity.new_value && (
                                    <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
                                        {Object.keys(activity.new_value).map(key => (
                                            <div key={key} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <span className="font-bold text-slate-500 uppercase tracking-wider w-24">{key}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-rose-500 line-through">{renderValue(activity.old_value[key])}</span>
                                                    <span>→</span>
                                                    <span className="text-emerald-600 font-bold">{renderValue(activity.new_value[key])}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {loading && (
                    <div className="flex justify-center py-10">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                    </div>
                )}

                {!loading && activities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <ActivityIcon size={40} className="opacity-20" />
                        </div>
                        <p className="text-lg font-bold text-slate-500">No activity recorded yet</p>
                        <p className="text-sm">Activities will appear here as tasks are created and updated.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function getIconForActivity(activity: any) {
    if (activity.action === 'comment') return <MessageCircle size={18} />;
    if (activity.action === 'created') return <Plus size={18} />;
    if (activity.action === 'deleted') return <FileText size={18} />;
    if (activity.action.endsWith('_updated')) return <ActivityIcon size={18} />;
    return <User size={18} />;
}

function formatActivityMessage(activity: any) {
    const action = activity.action;
    if (action.endsWith('_updated')) {
        return `updated ${action.replace('_updated', '')} for`;
    }

    switch (action) {
        case 'created':
            return `created`;
        case 'updated':
            return `updated`;
        case 'comment':
            return `commented on`;
        case 'deleted':
            return `deleted`;
        default:
            return action;
    }
}

function renderValue(val: any): string {
    if (val === null || val === undefined) return 'Empty';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
}

function stripTags(html: string) {
    return html.replace(/<[^>]*>?/gm, '');
}
