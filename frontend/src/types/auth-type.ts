import 'next-auth/jwt';

export type LoginResponse = {
    access_token: string;
    refresh_token: string;
    user: UserResponse;
};

export type UserResponse = {
    id: string;
    name: string;
    email: string;
    auth_provider?: string;
    avatar_url?: string | null;
    role?: string;
    created_at: string;
    updated_at: string;
};

declare module 'next-auth' {
    interface User {
        accessToken?: string;
        refreshToken?: string;
        backendUserId?: string;
    }

    interface Session {
        accessToken?: string;
        refreshToken?: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        backendUserId?: string;
    }
}
