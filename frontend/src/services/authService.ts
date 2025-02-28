import api from '@/lib/axios';
import { LoginResponse } from '@/types/authType';

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
};
