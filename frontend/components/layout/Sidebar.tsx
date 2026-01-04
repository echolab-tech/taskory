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
    Briefcase,
    Settings,
    Settings2
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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Org Settings / Invite State
    const [isOrgSettingsOpen, setIsOrgSettingsOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteMessage(null);

        const targetOrgId = currentOrgId || organizations[0]?.id;

        if (!targetOrgId) {
            setInviteMessage({ type: 'error', text: "No organization selected." });
            setInviteLoading(false);
            return;
        }

        try {
            await api.post(`/organizations/${targetOrgId}/users`, {
                email: inviteEmail,
                project_id: currentProjectId || undefined
            });
            setInviteMessage({ type: 'success', text: "Invitation sent successfully!" });
            setInviteEmail("");
        } catch (err: any) {
            setInviteMessage({ type: 'error', text: err.response?.data?.message || "Failed to send invitation." });
        } finally {
            setInviteLoading(false);
        }
    };

    // Helper to check active state for sidebar items
    const isSidebarItemActive = (path: string) => {
        return pathname.endsWith(path);
    };

    return (
        <>
            <div className="flex h-screen w-80 overflow-hidden text-slate-900 border-r border-white/50 bg-white/30 backdrop-blur-2xl flex-shrink-0 relative z-50">
                {/* LEFT RAIL - Project Switcher (Now Transparent/Glass) */}
                <div className="flex flex-col items-center w-16 bg-white/20 border-r border-white/30 py-4 gap-4 flex-shrink-0 z-20">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white mb-2 shadow-lg shadow-blue-500/30 cursor-pointer hover:scale-105 transition-transform" onClick={() => router.push('/dashboard')}>
                        <span className="font-black text-lg">T</span>
                    </div>

                    <div className="w-8 h-[1px] bg-slate-900/10" />

                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto w-full items-center no-scrollbar py-2 px-1">
                        {projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => handleProjectClick(project)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 relative group flex-shrink-0 ${currentProjectId === project.id.toString()
                                    ? "bg-slate-800 text-white shadow-[0_0_20px_rgba(37,99,235,0.6)] ring-2 ring-blue-400 ring-offset-2 ring-offset-white/20 scale-110"
                                    : "bg-white/40 text-slate-500 hover:bg-white/80 hover:text-slate-900 shadow-sm"
                                    }`}
                                title={project.name}
                            >
                                <span>{project.name.substring(0, 2).toUpperCase()}</span>
                                {/* Optional: Keep or remove the side indicator based on preference. Removed here to focus on the border/glow as requested. */}
                            </button>
                        ))}

                        <button
                            onClick={() => setIsPopupOpen(true)}
                            className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-300/60 flex items-center justify-center text-slate-400 hover:border-slate-500 hover:text-slate-600 transition-colors bg-white/20 flex-shrink-0"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-500 transition-colors mt-auto">
                        <LogOut size={20} />
                    </button>
                </div>

                {/* SECONDARY SIDEBAR - Functional Navigation */}
                <div className="flex flex-col w-64 bg-transparent">
                    {/* Project Header - Primary Location for Project Name */}
                    <div className="h-16 flex flex-col justify-center px-6 border-b border-white/40 overflow-hidden bg-white/10 relative group">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-0.5">Current Project</span>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-800 truncate tracking-tight text-lg drop-shadow-sm">
                                {projects.find(p => p.id.toString() === currentProjectId)?.name || "Select Project"}
                            </span>
                        </div>
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

                                <div className="space-y-1 pt-4 border-t border-white/40">
                                    <p className="px-3 text-[10px] font-bold text-slate-500 tracking-widest mb-2 uppercase opacity-70">Work</p>
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
                                <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                    <Briefcase size={24} className="text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Select a project to see its navigation.</p>
                            </div>
                        )}
                    </div>

                    {/* User Info & Settings */}
                    <div className="relative">
                        {isSettingsOpen && (
                            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden z-[60] animate-in slide-in-from-bottom-2 duration-200">
                                <div className="p-3 border-b border-white/50 bg-white/30">
                                    <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">User Control</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white/80 rounded-lg transition-colors group">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50/50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                                            <User size={16} />
                                        </div>
                                        Personal Profile
                                    </button>
                                    <button
                                        onClick={() => { setIsSettingsOpen(false); setIsOrgSettingsOpen(true); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-white/80 rounded-lg transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-slate-100/50 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
                                            <Settings2 size={16} />
                                        </div>
                                        Workplace Settings
                                    </button>
                                    <div className="h-px bg-white/50 my-2" />
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50/50 rounded-lg transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-rose-50/50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 transition-colors">
                                            <LogOut size={16} />
                                        </div>
                                        Sign Out System
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="p-4 border-t border-white/40 bg-white/20 backdrop-blur-md flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-black text-[10px] border border-slate-700 uppercase shadow-lg shadow-slate-900/10">
                                {user?.name?.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 truncate tracking-tight">{user?.name}</p>
                                <p className="text-[10px] font-bold text-slate-500 truncate tracking-wider uppercase">{user?.email?.split('@')[0]}</p>
                            </div>
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={`p-2 rounded-lg transition-all ${isSettingsOpen ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-800 hover:bg-white/40'}`}
                            >
                                <Settings size={18} className={isSettingsOpen ? 'animate-spin-slow' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CREATE PROJECT MODAL */}
            {isPopupOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
                        onClick={() => setIsPopupOpen(false)}
                    />

                    <div className="relative w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-white/50 flex items-center justify-between bg-white/40">
                            <h3 className="font-bold text-slate-800">Create New Project</h3>
                            <button
                                onClick={() => setIsPopupOpen(false)}
                                className="p-1.5 hover:bg-black/5 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-rose-50/50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 tracking-widest flex items-center gap-2 uppercase">
                                    <Briefcase size={12} />
                                    Project Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder-slate-400 shadow-sm"
                                    placeholder="e.g. Q1 Marketing Campaign"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 tracking-widest flex items-center gap-2 uppercase">
                                    <Building2 size={12} />
                                    Organization
                                </label>
                                <select
                                    required
                                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium appearance-none text-slate-700 shadow-sm"
                                    value={selectedOrgId}
                                    onChange={(e) => setSelectedOrgId(e.target.value)}
                                    disabled={isSubmitting}
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
                                    className="flex-1 px-4 py-3 bg-white/50 border border-white/60 text-slate-600 rounded-xl text-sm font-bold hover:bg-white transition-all"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        "Create Project"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* WORKPLACE SETTINGS / INVITE MODAL */}
            {isOrgSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
                        onClick={() => setIsOrgSettingsOpen(false)}
                    />

                    <div className="relative w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-white/50 flex items-center justify-between bg-white/40">
                            <h3 className="font-bold text-slate-800">Invite Members</h3>
                            <button
                                onClick={() => setIsOrgSettingsOpen(false)}
                                className="p-1.5 hover:bg-black/5 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleInviteMember} className="p-6 space-y-5">
                            {inviteMessage && (
                                <div className={`p-3 border text-xs font-bold rounded-xl flex items-center gap-2 ${inviteMessage.type === 'success' ? 'bg-green-50/50 border-green-100 text-green-600' : 'bg-rose-50/50 border-rose-100 text-rose-600'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${inviteMessage.type === 'success' ? 'bg-green-500' : 'bg-rose-500'}`} />
                                    {inviteMessage.text}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 tracking-widest flex items-center gap-2 uppercase">
                                    <User size={12} />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder-slate-400 shadow-sm"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    disabled={inviteLoading}
                                />
                                <p className="text-[10px] text-slate-400 font-medium px-1">
                                    They will receive an email invitation to join <strong>{organizations.find(o => o.id.toString() === currentOrgId)?.name || "your organization"}</strong>.
                                </p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOrgSettingsOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white/50 border border-white/60 text-slate-600 rounded-xl text-sm font-bold hover:bg-white transition-all"
                                    disabled={inviteLoading}
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {inviteLoading ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        "Send Invitation"
                                    )}
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
            className={`flex items-center px-4 py-2.5 text-sm font-bold rounded-xl transition-all gap-3 duration-200 group ${active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-white/60"
                : "text-slate-500 hover:bg-white/40 hover:text-slate-900"
                }`}
        >
            <div className={`transition-colors ${active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}>
                {icon}
            </div>
            <span>{label}</span>
            {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50" />
            )}
        </Link>
    );
}
