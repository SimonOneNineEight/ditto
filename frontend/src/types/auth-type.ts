export type LoginResponse = {
    access_token: string;
    refresh_token: string;
    token_type: 'Bearer';
};

export type UserResponse = {
    id: string;
    name: string;
    email: string;
    auth_provider: string;
    avatar_url: string | null;
    role: string;
    created_at: string;
    updated_at: string;
};
