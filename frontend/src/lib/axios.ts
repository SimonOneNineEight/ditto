import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { getSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { getErrorMessage, isValidationError } from './errors';

declare module 'axios' {
    interface AxiosRequestConfig {
        _suppressToast?: boolean;
        _retryAfterRefresh?: boolean;
    }
}

const CSRF_HEADER = 'X-CSRF-Token';
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000;

let csrfToken: string | null = null;
const retryCountMap = new WeakMap<object, number>();

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (error: unknown) => void;
    config: InternalAxiosRequestConfig;
}> = [];

function processQueue(token: string | null, error?: unknown) {
    failedQueue.forEach(({ resolve, reject, config }) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            config._retryAfterRefresh = true;
            resolve(api(config));
        } else {
            reject(error);
        }
    });
    failedQueue = [];
}

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

function shouldRetry(error: AxiosError, retryCount: number): boolean {
    if (retryCount >= MAX_RETRIES) return false;
    if (!error.response) return true;
    return error.response.status >= 500;
}

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
    async (error: AxiosError) => {
        const config = error.config;

        // Retry logic for network errors and 5xx
        if (config) {
            const retryCount = retryCountMap.get(config) ?? 0;
            if (shouldRetry(error, retryCount)) {
                retryCountMap.set(config, retryCount + 1);
                const delay = RETRY_BASE_DELAY * Math.pow(2, retryCount);
                await new Promise((resolve) => setTimeout(resolve, delay));
                return api(config);
            }
        }

        if (error.response) {
            if (error.response.status === 401 && typeof window !== 'undefined') {
                const isRefreshRequest = config?.url?.includes('/refresh_token');

                if (isRefreshRequest || config?._retryAfterRefresh) {
                    toast.error('Session expired. Please log in again.');
                    await signOut({ callbackUrl: '/login' });
                    return Promise.reject(error);
                }

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject, config: config! });
                    });
                }

                isRefreshing = true;

                try {
                    const session = await getSession();

                    if (session?.accessToken && !session.error) {
                        processQueue(session.accessToken as string);
                        isRefreshing = false;

                        config!.headers.Authorization = `Bearer ${session.accessToken}`;
                        config!._retryAfterRefresh = true;
                        return api(config!);
                    }
                } catch {
                    // Refresh failed
                }

                processQueue(null, error);
                isRefreshing = false;

                toast.error('Session expired. Please log in again.');
                await signOut({ callbackUrl: '/login' });
                return Promise.reject(error);
            }

            if (error.response.status === 403 && error.response.data &&
                (error.response.data as Record<string, unknown>)?.code === 'CSRF_ERROR') {
                csrfToken = null;
            }

            if (!isValidationError(error) && !config?._suppressToast) {
                toast.error(getErrorMessage(error));
            }
        } else if (!config?._suppressToast) {
            toast.error(getErrorMessage(error));
        }

        return Promise.reject(error);
    }
);

export default api;
