"use client";

import React from "react";
import { Clock } from "lucide-react";

export default function ProjectTasksTimelinePage() {
    return (
        <div className="flex flex-col items-center justify-center py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl gap-4">
            <Clock size={48} className="text-slate-300" strokeWidth={1} />
            <div className="text-center">
                <h3 className="font-bold text-slate-900">Project Timeline</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">Visualize your tasks on a linear timeline to manage deadlines effectively.</p>
            </div>
        </div>
    );
}
