"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";

export default function GlobalDashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        const redirectToFirstProject = async () => {
            try {
                const res = await api.get("/projects");
                const projects = res.data.data;
                if (projects && projects.length > 0) {
                    const firstProject = projects[0];
                    router.replace(`/${firstProject.organization_id}/project/${firstProject.id}/home`);
                } else {
                    router.replace("/setup");
                }
            } catch (err) {
                console.error("Error fetching projects for redirect", err);
                router.replace("/auth/login");
            }
        };

        redirectToFirstProject();
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
    );
}
