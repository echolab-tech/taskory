"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    Bell,
    LogOut,
    Activity,
    Home,
    User,
    List,
    Trello,
    BarChart3,
    Clock,
    X,
    Building2,
    Briefcase
} from "lucide-react";
import { useAuth } from "@/app/lib/useAuth";
import api from "@/app/lib/api";
import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";

export function AppSidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();

    // Get orgId and projectId from URL params
    const currentOrgId = params.orgId as string;
    const currentProjectId = params.projectId as string;

    const [projects, setProjects] = useState<any[]>([]);
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    // New Project Form State
    const [newProjectName, setNewProjectName] = useState("");
    const [selectedOrgId, setSelectedOrgId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projectsRes, orgsRes] = await Promise.all([
                api.get("/projects"),
                api.get("/organizations")
            ]);

            const projectData = projectsRes.data.data || [];
            const orgData = orgsRes.data.data || [];

            setProjects(projectData);
            setOrganizations(orgData);

            if (orgData.length > 0) {
                setSelectedOrgId(orgData[0].id.toString());
            }
        } catch (err) {
            console.error("Error fetching data", err);
        }
    };

    const handleProjectClick = (project: any) => {
        // Navigate to the project's home page using the new hierarchical URL
        router.push(`/${project.organization_id}/project/${project.id}/home`);
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const response = await api.post("/projects", {
                name: newProjectName,
                organization_id: selectedOrgId
            });

            const newProject = response.data.data;
            setProjects([...projects, newProject]);
            setIsPopupOpen(false);
            setNewProjectName("");

            // Navigate to the new project's home page
            router.push(`/${selectedOrgId}/project/${newProject.id}/home`);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create project");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to check active state for sidebar items
    const isSidebarItemActive = (path: string) => {
        return pathname.endsWith(path);
    };

    return (
        <>
            <div className="flex h-screen w-80 overflow-hidden text-slate-900 border-r border-slate-200 bg-white flex-shrink-0">
                {/* LEFT RAIL - Project Switcher */}
                <div className="flex flex-col items-center w-16 bg-slate-900 py-4 gap-4 flex-shrink-0 z-20">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-2 shadow-lg cursor-pointer" onClick={() => router.push('/dashboard')}>
                        <span className="font-black text-lg">T</span>
                    </div>

                    <div className="w-8 h-[1px] bg-slate-800" />

                    <div className="flex-1 flex flex-col gap-3 overflow-y-auto w-full items-center no-scrollbar">
                        {projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => handleProjectClick(project)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all relative group ${currentProjectId === project.id.toString()
                                    ? "bg-white text-slate-900"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                                    }`}
                                title={project.name}
                            >
                                <span>{project.name.substring(0, 2).toUpperCase()}</span>
                                {currentProjectId === project.id.toString() && (
                                    <div className="absolute left-0 w-1 h-5 bg-blue-500 rounded-r-full" />
                                )}
                            </button>
                        ))}

                        <button
                            onClick={() => setIsPopupOpen(true)}
                            className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <button onClick={logout} className="p-2 text-slate-500 hover:text-rose-400 transition-colors mt-auto">
                        <LogOut size={20} />
                    </button>
                </div>

                {/* SECONDARY SIDEBAR - Functional Navigation */}
                <div className="flex flex-col w-64 bg-slate-50">
                    {/* Project Header */}
                    <div className="h-16 flex items-center px-6 border-b border-slate-200 overflow-hidden">
                        <span className="font-bold text-slate-900 truncate">
                            {projects.find(p => p.id.toString() === currentProjectId)?.name || "Taskory"}
                        </span>
                    </div>

                    {/* Navigation Items - Only show if a project is selected */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {currentProjectId && currentOrgId ? (
                            <>
                                <div className="space-y-1">
                                    <SidebarItem
                                        icon={<Home size={18} />}
                                        label="Home"
                                        active={isSidebarItemActive('/home')}
                                        href={`/${currentOrgId}/project/${currentProjectId}/home`}
                                    />
                                    <SidebarItem
                                        icon={<Activity size={18} />}
                                        label="Activity"
                                        active={isSidebarItemActive('/activity')}
                                        href={`/${currentOrgId}/project/${currentProjectId}/activity`}
                                    />
                                    <SidebarItem
                                        icon={<User size={18} />}
                                        label="My Task"
                                        active={isSidebarItemActive('/mytask')}
                                        href={`/${currentOrgId}/project/${currentProjectId}/mytask`}
                                    />
                                </div>

                                <div className="space-y-1 pt-4 border-t border-slate-200">
                                    <p className="px-3 text-[10px] font-bold text-slate-400 tracking-widest mb-2">Work</p>
                                    <SidebarItem
                                        icon={<List size={18} />}
                                        label="Tasks"
                                        active={pathname === `/${currentOrgId}/project/${currentProjectId}/tasks`}
                                        href={`/${currentOrgId}/project/${currentProjectId}/tasks`}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <Briefcase size={40} className="text-slate-200 mb-4" />
                                <p className="text-sm text-slate-400">Select a project to see its navigation.</p>
                            </div>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="p-4 border-t border-slate-200 bg-white shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 uppercase">
                            {user?.name?.substring(0, 1).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            <Bell size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CREATE PROJECT MODAL */}
            {isPopupOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        onClick={() => setIsPopupOpen(false)}
                    />

                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="font-bold text-slate-900">Create New Project</h3>
                            <button
                                onClick={() => setIsPopupOpen(false)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 tracking-widest flex items-center gap-2">
                                    <Briefcase size={12} />
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    placeholder="e.g. Q1 Marketing Campaign"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 tracking-widest flex items-center gap-2">
                                    <Building2 size={12} />
                                    Organization
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium appearance-none"
                                    value={selectedOrgId}
                                    onChange={(e) => setSelectedOrgId(e.target.value)}
                                >
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPopupOpen(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isSubmitting ? "Creating..." : "Create Project"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

function SidebarItem({ icon, label, active, href }: { icon: any, label: string, active?: boolean, href: string }) {
    return (
        <Link
            href={href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all gap-3 ${active
                ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
                }`}
        >
            <div className={active ? "text-blue-600" : "text-slate-400"}>
                {icon}
            </div>
            <span>{label}</span>
        </Link>
    );
}
