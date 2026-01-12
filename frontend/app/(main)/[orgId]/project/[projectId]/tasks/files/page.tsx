"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
    FileText,
    Download,
    Trash2,
    UploadCloud,
    Loader2,
    User,
    Calendar,
    HardDrive
} from "lucide-react";
import api from "@/app/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function ProjectFilesPage() {
    const { projectId } = useParams();
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (projectId) {
            fetchFiles();
        }
    }, [projectId]);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/projects/${projectId}/attachments`);
            setFiles(res.data.data || []);
        } catch (err) {
            console.error("Failed to fetch files", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !projectId) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('attachable_type', 'project');
            formData.append('attachable_id', projectId as string);

            await api.post('/attachments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Refresh list
            fetchFiles();
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload file");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDownload = async (attachment: any) => {
        try {
            // We need a way to trigger download. usually API returns a blob or a redirect.
            // Verify Backend Controller download method: returns Storage::download.
            // So browsers should handle it if we open in new tab or specific fetch.
            // For Auth protected files, we might need to fetch blob and create object URL.

            const response = await api.get(`/attachments/${attachment.id}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', attachment.file_name);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    const handleDelete = async (attachmentId: number) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            await api.delete(`/attachments/${attachmentId}`);
            setFiles(prev => prev.filter(f => f.id !== attachmentId));
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Project Files</h3>
                    <p className="text-sm text-slate-500 mt-1">Manage documents and assets for this project.</p>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                        Upload File
                    </button>
                </div>
            </div>

            {/* File List */}
            {files.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 py-20">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <FileText size={32} className="opacity-50" />
                    </div>
                    <p className="text-sm font-medium">No files uploaded yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-black">Name</th>
                                <th className="px-6 py-4 font-black">Size</th>
                                <th className="px-6 py-4 font-black">Uploaded By</th>
                                <th className="px-6 py-4 font-black">Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {files.map((file) => (
                                <tr key={file.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                <FileText size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{file.file_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                            {formatSize(file.file_size)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-slate-400" />
                                            <span className="text-sm text-slate-600 font-medium">
                                                {file.user?.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Calendar size={14} />
                                            <span className="text-xs font-medium">
                                                {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDownload(file)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
