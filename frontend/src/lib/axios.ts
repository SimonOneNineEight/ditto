import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const CSRF_HEADER = 'X-CSRF-Token';

let csrfToken: string | null = null;

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    if (typeof window !== 'undefined') {
        const session = await getSession();

        if (session?.error === 'RefreshTokenError') {
            await signOut({ callbackUrl: '/login' });
            return Promise.reject(new Error('Session expired'));
        }

        if (session?.accessToken) {
            config.headers.Authorization = `Bearer ${session.accessToken}`;
        }

        const method = config.method?.toUpperCase();
        if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
            if (csrfToken) {
                config.headers[CSRF_HEADER] = csrfToken;
            }
        }
    }

    return config;
});

api.interceptors.response.use(
    (response) => {
        const newToken = response.headers[CSRF_HEADER.toLowerCase()];
        if (newToken) {
            csrfToken = newToken;
        }
        return response;
    },
    async (error) => {
        if (error.response) {
            console.error('Response Error: ', error.response.data);
            console.error('Status: ', error.response.status);

            if (error.response.status === 401 && typeof window !== 'undefined') {
                await signOut({ callbackUrl: '/login' });
            }

            if (error.response.status === 403 && error.response.data?.code === 'CSRF_ERROR') {
                csrfToken = null;
            }
        } else if (error.request) {
            console.error('Request Error: ', error.request);
        } else {
            console.error('Error: ', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
