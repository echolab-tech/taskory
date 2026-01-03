"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from './api';

interface User {
    id: number;
    name: string;
    email: string;
}

export function useAuth() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setLoading(false);
                if (pathname !== '/auth/login' && pathname !== '/auth/register') {
                    router.push('/auth/login');
                }
                return;
            }

            try {
                const res = await api.get('/me');
                const data = res.data;
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.needs_setup) {
                    if (!data.email_verified) {
                        // User needs to verify email, maybe redirect to a "Verify Your Email" page
                        // For now, let's just allow them to stay or redirect to login
                        if (pathname === '/dashboard' || pathname === '/setup') {
                            router.push('/auth/login');
                        }
                    } else if (!data.has_organization) {
                        if (pathname !== '/setup') {
                            router.push('/setup');
                        }
                    }
                } else if (pathname === '/setup') {
                    router.push('/dashboard');
                }
            } catch (error) {
                // Token invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/auth/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router, pathname]);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/auth/login');
    };

    return { user, loading, logout };
}
