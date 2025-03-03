import api from '@/lib/axios';
import { LoginResponse, UserResponse } from '@/types/authType';

export const authService = {
    async register(
        name: string,
        email: string,
        password: string
    ): Promise<LoginResponse> {
        try {
            const { data } = await api.post('/api/users', {
                name,
                email,
                password,
            });
            console.log(data);
            return data;
        } catch (error) {
            console.error('Error registering user: ', error);
            throw error;
        }
    },

    async login(email: string, password: string): Promise<LoginResponse> {
        try {
            const { data } = await api.post('/api/login', {
                email,
                password,
            });

            return data;
        } catch (error) {
            console.error('Error logging in: ', error);
            throw error;
        }
    },

    async refreshToken(refreshToken: string): Promise<LoginResponse> {
        try {
            const { data } = await api.post('/api/refresh_token', {
                refresh_token: refreshToken,
            });
            return data.data;
        } catch (error) {
            console.error('Error refreshing token: ', error);
            throw error;
        }
    },

    async getMe(): Promise<UserResponse> {
        try {
            const { data } = await api.get('/api/me');

            return data;
        } catch (error) {
            console.error('Error fetching user: ', error);
            throw error;
        }
    },
};
