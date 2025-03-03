"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { authService } from '@/services/authService';
import { LoginResponse } from '@/types/authType';

export type User = {
    id: string;
    name: string;
    email: string;
}

export type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (user: User) => void;
    refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    error: null,
    login: async () => { },
    register: async () => { },
    logout: () => { },
    updateUser: () => { },
    refreshToken: async () => null,
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            if (!accessToken || !refreshToken) {
                setIsLoading(false);
                return;
            }

            try {
                if (isTokenExpire(accessToken)) {
                    if (!refreshToken || isTokenExpire(refreshToken)) {
                        logout();
                        return;
                    }

                    const response = await authService.refreshToken(refreshToken);

                    localStorage.setItem('accessToken', response.access_token);
                    localStorage.setItem('refreshToken', response.refresh_token);

                    api.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;
                } else {
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                }

                const userResponse = await authService.getMe();
                setUser(userResponse);
            } catch (error) {
                console.error('Error initializing auth: ', error);
                logout();
            } finally {

                setIsLoading(false);
            }
        }

        initializeAuth();
    }, []);

    useEffect(() => {
        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    const newToken = await refreshToken();

                    if (newToken) {
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return api(originalRequest);
                    }
                }

                return Promise.reject(error);
            }
        );


        return () => {
            api.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const authResponse = await authService.login(email, password);

            setupAuthentication(authResponse);

            api.defaults.headers.common['Authorization'] = `Bearer ${authResponse.access_token}`;

            const userResponse = await authService.getMe();

            setUser(userResponse);
        } catch (error: any) {
            console.error('Error logging in: ', error);
            setError(error?.response?.data?.error || 'Failed to login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }


    const register = async (name: string, email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            const authResponse = await authService.register(name, email, password);

            setupAuthentication(authResponse);
        } catch (error: any) {
            console.error('Error logging in: ', error);
            setError(error?.response?.data?.error || 'Failed to login. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        delete api.defaults.headers.common['Authorization'];

        setUser(null);

        router.push('/');
    }

    const updateUser = (user: User) => { }
    const refreshToken = async () => {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken || isTokenExpire(refreshToken)) {
            logout();
            return null;
        }

        try {
            const response = await authService.refreshToken(refreshToken);

            setupAuthentication(response);

            return response.access_token;
        } catch (error) {
            console.error('Error refreshing token: ', error);
            logout();
            return null;
        }
    }

    const setupAuthentication = (authResponse: LoginResponse) => {
        localStorage.setItem('accessToken', authResponse.access_token);
        localStorage.setItem('refreshToken', authResponse.refresh_token);
        api.defaults.headers.common['Authorization'] = `Bearer ${authResponse.access_token}`;
    }

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            error,
            login,
            register,
            logout,
            updateUser,
            refreshToken,
        }
        }>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

const isTokenExpire = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (error) {
        return true;
    }
}
