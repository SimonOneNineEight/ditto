import api from '@/lib/axios';

export interface ProviderInfo {
    auth_provider: string;
    provider_email?: string;
    avatar_url?: string;
    created_at: string;
}

export interface LinkProviderRequest {
    provider: string;
    email: string;
    name: string;
    avatar_url?: string;
}

export const accountService = {
    async getLinkedProviders(): Promise<ProviderInfo[]> {
        const { data } = await api.get('/api/account/providers');
        return data.data;
    },

    async linkProvider(req: LinkProviderRequest): Promise<ProviderInfo[]> {
        const { data } = await api.post('/api/account/link-provider', req);
        return data.data;
    },

    async unlinkProvider(provider: string): Promise<ProviderInfo[]> {
        const { data } = await api.delete(`/api/account/providers/${provider}`);
        return data.data;
    },

    async setPassword(password: string): Promise<{ message: string }> {
        const { data } = await api.post('/api/account/set-password', { password });
        return data.data;
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
        const { data } = await api.put('/api/account/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
        });
        return data.data;
    },
};
