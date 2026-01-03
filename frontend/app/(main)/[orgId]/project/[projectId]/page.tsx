"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ProjectIndexPage() {
    const { orgId, projectId } = useParams();
    const router = useRouter();

    useEffect(() => {
        if (orgId && projectId) {
            router.replace(`/${orgId}/project/${projectId}/home`);
        }
    }, [orgId, projectId, router]);

    return (
        <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
    );
}
