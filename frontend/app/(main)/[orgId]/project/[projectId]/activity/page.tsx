"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useAuth } from '@/app/lib/useAuth';
import { Bell, Activity as ActivityIcon, MessageCircle, FileText, User } from "lucide-react";

export default function ProjectActivityPage() {
    const { orgId, projectId } = useParams();
    const { user } = useAuth();
    if (!user) return null;

    const activities = [
        { type: 'comment', user: 'Alex Morgan', action: 'commented on', target: 'Homepage Design', time: '2 mins ago', icon: <MessageCircle size={14} />, color: 'text-blue-500', bg: 'bg-blue-50' },
        { type: 'status', user: 'Sam Smith', action: 'moved', target: 'API Integration', to: 'Completed', time: '1 hour ago', icon: <ActivityIcon size={14} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { type: 'document', user: 'Jordan Lee', action: 'attached a new file to', target: 'Project Proposal', time: '3 hours ago', icon: <FileText size={14} />, color: 'text-amber-500', bg: 'bg-amber-50' },
        { type: 'assign', user: 'System', action: 'assigned you to', target: 'Bug Fix: Login Error', time: '5 hours ago', icon: <User size={14} />, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                    <ActivityIcon size={20} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Project Activity</h2>
                    <p className="text-slate-500">Real-time updates for this project.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                {activities.map((activity, i) => (
                    <div key={i} className="p-6 flex gap-5 hover:bg-slate-50/50 transition-colors">
                        <div className={`w-10 h-10 rounded-full ${activity.bg} ${activity.color} flex items-center justify-center shrink-0`}>
                            {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-600">
                                <span className="font-bold text-slate-900">{activity.user}</span> {activity.action} <span className="font-bold text-slate-900">{activity.target}</span>
                                {activity.to && <span className="ml-1 italic text-slate-400">to {activity.to}</span>}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
