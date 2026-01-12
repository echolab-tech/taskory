"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from '@/app/lib/useAuth';
import {
    Activity,
    Clock,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ArrowRight,
    TrendingUp,
    Users,
    Target,
    Timer,
    User,
    ListTodo,
    BarChart3
} from "lucide-react";
import api from "@/app/lib/api";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function ProjectHomePage() {
    const { orgId, projectId } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) {
            fetchDashboardData();
        }
    }, [projectId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [projectRes, tasksRes, activitiesRes, membersRes, statusRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/tasks?project_id=${projectId}`),
                api.get(`/projects/${projectId}/dashboard`),
                api.get(`/projects/${projectId}/users`),
                api.get(`/task-statuses?project_id=${projectId}`)
            ]);

            setProject(projectRes.data.data);
            setTasks(tasksRes.data.data || []);
            const activitiesData = activitiesRes.data.data;
            setActivities(Array.isArray(activitiesData) ? activitiesData.slice(0, 5) : []);
            setTeamMembers(membersRes.data.data || []);
            setStatuses(statusRes.data.data || []);
        } catch (err) {
            console.error("Error fetching dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    if (!user || loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status?.name === 'Done' || t.status?.name === 'Completed').length;
    const inProgressTasks = tasks.filter(t => t.status?.name === 'In Progress').length;

    // Fix: Only count as overdue if NOT completed AND the date has actually passed (today is not overdue)
    const overdueTasks = tasks.filter(t => {
        if (!t.due_date || t.status?.name === 'Done' || t.status?.name === 'Completed') return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(23, 59, 59, 999); // Due date is inclusive of the whole day
        return dueDate < new Date();
    }).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const statusStats = statuses.map(status => ({
        ...status,
        count: tasks.filter(t => t.status_id === status.id).length
    }));

    // Calculate hours
    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0);
    const totalActualHours = tasks.reduce((sum, t) => sum + (parseFloat(t.actual_hours) || 0), 0);
    const hoursProgress = totalEstimatedHours > 0 ? Math.round((totalActualHours / totalEstimatedHours) * 100) : 0;

    // Upcoming deadlines (next 7 days)
    const upcomingTasks = tasks
        .filter(t => {
            if (!t.due_date || t.status?.name === 'Done' || t.status?.name === 'Completed') return false;
            const dueDate = new Date(t.due_date);
            const today = new Date();
            const weekFromNow = new Date();
            weekFromNow.setDate(today.getDate() + 7);
            return dueDate >= today && dueDate <= weekFromNow;
        })
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(0, 5);

    // Team workload
    const teamWorkload = teamMembers.map(member => {
        const assignedTasks = tasks.filter(t => t.assignee_id === member.id);
        const activeTasks = assignedTasks.filter(t => t.status?.name !== 'Done' && t.status?.name !== 'Completed');
        return {
            ...member,
            totalTasks: assignedTasks.length,
            activeTasks: activeTasks.length
        };
    }).sort((a, b) => b.activeTasks - a.activeTasks);

    // Health Score Calculation
    const isProjectComplete = totalTasks > 0 && completedTasks === totalTasks;
    const overdueRate = totalTasks > 0 ? (overdueTasks / totalTasks) : 0;
    const efficiencyRate = totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) : 1;

    let healthScore = 100;

    if (isProjectComplete) {
        healthScore = 100;
    } else {
        healthScore -= (overdueRate * 100 * 1.5);
        // Only penalize efficiency if project is active and significantly over
        if (efficiencyRate > 1.2) {
            healthScore -= Math.min(20, (efficiencyRate - 1.2) * 40);
        }
    }

    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    const getHealthStatus = (score: number) => {
        if (score >= 80) return { label: 'Healthy', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'CheckCircle2' };
        if (score >= 50) return { label: 'At Risk', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', icon: 'AlertCircle' };
        return { label: 'Critical', color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', icon: 'AlertCircle' };
    };

    const health = getHealthStatus(healthScore);

    // Priority breakdown
    const priorityStats = {
        high: tasks.filter(t => t.priority === 'high' && t.status?.name !== 'Done' && t.status?.name !== 'Completed').length,
        medium: tasks.filter(t => t.priority === 'medium' && t.status?.name !== 'Done' && t.status?.name !== 'Completed').length,
        low: tasks.filter(t => t.priority === 'low' && t.status?.name !== 'Done' && t.status?.name !== 'Completed').length,
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{project?.name}</h2>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${health.bg} ${health.color} ${health.border}`}>
                            Project {health.label}
                        </div>
                    </div>
                    <p className="text-slate-500 mt-1">Intelligent Health Monitoring & Resource Overview</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
            </div>

            {/* Health & Quick Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Health Score Card */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${health.bg}`} />

                    <div className="relative mb-4">
                        <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-100"
                            />
                            <motion.circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364.4}
                                initial={{ strokeDashoffset: 364.4 }}
                                animate={{ strokeDashoffset: 364.4 - (364.4 * healthScore) / 100 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className={health.color}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-900">{healthScore}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health</span>
                        </div>
                    </div>
                    <h3 className={`text-lg font-black ${health.color}`}>{health.label}</h3>
                    <p className="text-xs text-slate-400 mt-1 px-4 italic">
                        {isProjectComplete ? "Congratulations! Project successfully completed." :
                            healthScore >= 80 ? "Everything looks great! Keep it up." :
                                overdueTasks > 0 ? "Some issues detected. Check overdue tasks." :
                                    efficiencyRate > 1.2 ? "Performance warning: Tasks taking longer than estimated." :
                                        "Immediate action required!"}
                    </p>
                </div>

                {/* Main Metrics */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><ListTodo size={20} /></div>
                            <span className="text-xs font-bold text-slate-400">Completion</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-900">{completionRate}%</div>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionRate}%` }}
                                    className="h-full bg-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle size={20} /></div>
                            <span className="text-xs font-bold text-slate-400">Risk Factor</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-900">{overdueTasks}</div>
                            <p className="text-xs text-slate-500 font-medium mt-1">Overdue tasks need review</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Timer size={20} /></div>
                            <span className="text-xs font-bold text-slate-400">Time Usage Ratio</span>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-slate-900">
                                {efficiencyRate.toFixed(1)}x
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-1">Actual vs Estimated Hours</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Priority & Status */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Task Priority Analysis */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Target size={16} className="text-rose-500" />
                                Active Priority Breakdown
                            </h3>
                            <span className="text-[10px] font-bold text-slate-400">Non-completed work</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-black text-rose-500 uppercase tracking-tighter mb-1">High Priority</div>
                                <div className="text-2xl font-black text-slate-900">{priorityStats.high}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-black text-amber-500 uppercase tracking-tighter mb-1">Medium</div>
                                <div className="text-2xl font-black text-slate-900">{priorityStats.medium}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1">Low</div>
                                <div className="text-2xl font-black text-slate-900">{priorityStats.low}</div>
                            </div>
                        </div>
                    </div>

                    {/* Workflow Pipeline */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                <BarChart3 size={16} />
                                Task Distribution by Status
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {statusStats.map((status) => {
                                const percentage = totalTasks > 0 ? Math.round((status.count / totalTasks) * 100) : 0;
                                return (
                                    <div key={status.id} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color || '#cbd5e1' }} />
                                                <span className="text-xs font-bold text-slate-700">{status.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-900">{status.count}</span>
                                        </div>
                                        <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: status.color || '#cbd5e1' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Side: Deadlines & Team */}
                <div className="space-y-6">
                    {/* Critical dates */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Clock size={16} />
                                Critical Deadlines
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {upcomingTasks.slice(0, 4).length === 0 ? (
                                <div className="px-6 py-8 text-center text-xs text-slate-400 font-bold">No pressing deadlines</div>
                            ) : (
                                upcomingTasks.slice(0, 4).map((task) => {
                                    const daysUntilDue = Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <div key={task.id} className="px-6 py-4 hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/${orgId}/project/${projectId}/tasks`)}>
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-xs font-bold text-slate-900 truncate flex-1">{task.title}</p>
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${daysUntilDue <= 1 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {daysUntilDue === 0 ? 'Today' : `${daysUntilDue}d`}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                <span>{task.assignee?.name}</span>
                                                <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Team Load */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Users size={16} />
                                Member workload
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {teamWorkload.slice(0, 4).map((member) => (
                                <div key={member.id} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">{member.name}</span>
                                        <span className="text-[10px] font-black text-slate-400">{member.activeTasks} active tasks</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${member.activeTasks > 5 ? 'bg-rose-500' : member.activeTasks > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min(100, (member.activeTasks / 8) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Feed */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Activity size={16} />
                        Recent project stream
                    </h3>
                    <button onClick={() => router.push(`/${orgId}/project/${projectId}/activity`)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-100">
                    {activities.slice(0, 4).map((activity) => (
                        <div key={activity.id} className="bg-white px-6 py-4 flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                <Activity size={14} className="text-slate-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-600 leading-tight">
                                    <span className="font-bold text-slate-900">{activity.user?.name}</span> {activity.action}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
