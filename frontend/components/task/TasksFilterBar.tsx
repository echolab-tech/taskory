
import React, { useState, useRef, useEffect } from "react";
import { Filter, Users, Calendar, CheckCircle2, X, Search, ChevronDown } from "lucide-react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import api from "@/app/lib/api";

export default function TasksFilterBar() {
    const { projectId } = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [users, setUsers] = useState<any[]>([]);
    const [statuses, setStatuses] = useState<any[]>([]);
    const [activePopup, setActivePopup] = useState<string | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [assigneeSearch, setAssigneeSearch] = useState("");

    // Initial Data Fetch
    useEffect(() => {
        if (!projectId) return;
        const fetchMeta = async () => {
            try {
                const [usersRes, statusRes] = await Promise.all([
                    api.get(`/projects/${projectId}/users`),
                    api.get(`/task-statuses?project_id=${projectId}`)
                ]);
                setUsers(usersRes.data.data || []);
                setStatuses(statusRes.data.data || []);
            } catch (error) {
                console.error("Failed to fetch filter meta", error);
            }
        };
        fetchMeta();
    }, [projectId]);

    // Derived State from URL
    const getValues = (key: string) => {
        return searchParams.getAll(key);
    };

    const filters = {
        assignee_ids: getValues('assignee_ids[]').map(Number),
        status_ids: getValues('status_ids[]').map(Number),
        created_at: { start: searchParams.get('date_created_start') || '', end: searchParams.get('date_created_end') || '' },
        updated_at: { start: searchParams.get('date_updated_start') || '', end: searchParams.get('date_updated_end') || '' },
        due_date: { start: searchParams.get('due_date_start') || '', end: searchParams.get('due_date_end') || '' },
    };

    const updateParams = (newParams: URLSearchParams) => {
        router.push(`${pathname}?${newParams.toString()}`);
    };

    // Close popup when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                setActivePopup(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const togglePopup = (popup: string) => {
        setActivePopup(p => p === popup ? null : popup);
    };

    const handleAssigneeToggle = (userId: number) => {
        const current = new Set(filters.assignee_ids);
        if (current.has(userId)) current.delete(userId);
        else current.add(userId);

        const params = new URLSearchParams(searchParams.toString());
        params.delete('assignee_ids[]');
        Array.from(current).forEach(id => params.append('assignee_ids[]', id.toString()));
        updateParams(params);
    };

    const handleStatusToggle = (statusId: number) => {
        const current = new Set(filters.status_ids);
        if (current.has(statusId)) current.delete(statusId);
        else current.add(statusId);

        const params = new URLSearchParams(searchParams.toString());
        params.delete('status_ids[]');
        Array.from(current).forEach(id => params.append('status_ids[]', id.toString()));
        updateParams(params);
    };

    const handleDateChange = (type: 'created_at' | 'updated_at' | 'due_date', field: 'start' | 'end', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const paramKey = type === 'created_at' ? `date_created_${field}` : type === 'updated_at' ? `date_updated_${field}` : `${type}_${field}`;

        if (value) {
            params.set(paramKey, value);
        } else {
            params.delete(paramKey);
        }
        updateParams(params);
    };

    const clearFilters = () => {
        router.push(pathname);
        setActivePopup(null);
    };

    const hasFilters = filters.assignee_ids.length > 0 ||
        filters.status_ids.length > 0 ||
        filters.created_at.start || filters.created_at.end ||
        filters.updated_at.start || filters.updated_at.end ||
        filters.due_date.start || filters.due_date.end;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 relative z-10 px-6 pt-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mr-2">
                <Filter size={16} />
                <span>Filters:</span>
            </div>

            {/* Assignee Filter */}
            <div className="relative">
                <button
                    onClick={() => togglePopup('assignee')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${filters.assignee_ids.length > 0 || activePopup === 'assignee'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Users size={14} />
                    <span>Assignee</span>
                    {filters.assignee_ids.length > 0 && (
                        <span className="ml-1 bg-blue-200 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full">
                            {filters.assignee_ids.length}
                        </span>
                    )}
                    <ChevronDown size={12} className={`opacity-50 ${activePopup === 'assignee' ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Status Filter */}
            <div className="relative">
                <button
                    onClick={() => togglePopup('status')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${filters.status_ids.length > 0 || activePopup === 'status'
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <CheckCircle2 size={14} />
                    <span>Status</span>
                    {filters.status_ids.length > 0 && (
                        <span className="ml-1 bg-blue-200 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-full">
                            {filters.status_ids.length}
                        </span>
                    )}
                    <ChevronDown size={12} className={`opacity-50 ${activePopup === 'status' ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Date Filters */}
            {['created_at', 'updated_at', 'due_date'].map((dateType) => {
                const label = dateType === 'created_at' ? 'Created' : dateType === 'updated_at' ? 'Updated' : 'Due Date';
                const key = dateType as 'created_at' | 'updated_at' | 'due_date';
                const isActive = filters[key].start || filters[key].end;

                return (
                    <div key={dateType} className="relative">
                        <button
                            onClick={() => togglePopup(dateType)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${isActive || activePopup === dateType
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <Calendar size={14} />
                            <span>{label}</span>
                            <ChevronDown size={12} className={`opacity-50 ${activePopup === dateType ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                );
            })}

            {/* Clear All */}
            {hasFilters && (
                <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors ml-auto"
                >
                    <X size={14} />
                    <span>Clear filters</span>
                </button>
            )}


            {/* Popup Content */}
            {activePopup && (
                <div ref={popupRef} className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 min-w-[300px] z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* Assignee Popup */}
                    {activePopup === 'assignee' && (
                        <div className="space-y-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search members..."
                                    value={assigneeSearch}
                                    onChange={(e) => setAssigneeSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                                    autoFocus
                                />
                            </div>
                            <div className="max-h-[200px] overflow-y-auto space-y-1">
                                {users.filter(u => u.name.toLowerCase().includes(assigneeSearch.toLowerCase())).map(user => (
                                    <label key={user.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={filters.assignee_ids.includes(user.id)}
                                            onChange={() => handleAssigneeToggle(user.id)}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="text-sm text-slate-700">{user.name}</span>
                                        </div>
                                    </label>
                                ))}
                                {users.length === 0 && <div className="text-center text-slate-400 text-sm py-2">No members found</div>}
                            </div>
                        </div>
                    )}

                    {/* Status Popup */}
                    {activePopup === 'status' && (
                        <div className="max-h-[240px] overflow-y-auto space-y-1">
                            {statuses.map(status => (
                                <label key={status.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={filters.status_ids.includes(status.id)}
                                        onChange={() => handleStatusToggle(status.id)}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                                        <span className="text-sm text-slate-700">{status.name}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Date Popups */}
                    {['created_at', 'updated_at', 'due_date'].includes(activePopup) && (
                        (() => {
                            const key = activePopup as 'created_at' | 'updated_at' | 'due_date';
                            const values = filters[key];
                            return (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Start Date</label>
                                            <input
                                                type="date"
                                                value={values.start}
                                                onChange={(e) => handleDateChange(key, 'start', e.target.value)}
                                                className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">End Date</label>
                                            <input
                                                type="date"
                                                value={values.end}
                                                onChange={(e) => handleDateChange(key, 'end', e.target.value)}
                                                className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>
            )}
        </div>
    );
}
