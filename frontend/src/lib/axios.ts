import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const session = await getSession();

    if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('Response Error: ', error.response.data);
            console.error('Status: ', error.response.status);
        } else if (error.request) {
            console.error('Request Error: ', error.resquest);
        } else {
            console.error('Error: ', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
