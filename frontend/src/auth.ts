import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { authService } from './services/auth-service';

const ACCESS_TOKEN_TTL = 24 * 60 * 60 * 1000;
const REFRESH_BUFFER = 5 * 60 * 1000;

async function refreshAccessToken(refreshToken: string) {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/refresh_token`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        return {
            accessToken: data.data.access_token,
            accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL,
        };
    } catch (error) {
        console.error('Token refresh failed:', error);
        return null;
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GitHub,
        Google,
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;
                }

                try {
                    const response = await authService.login(
                        credentials.email as string,
                        credentials.password as string
                    );

                    return {
                        id: response.user.id,
                        email: response.user.email,
                        name: response.user.name,
                        image: response.user.avatar_url || null,
                        accessToken: response.access_token,
                        refreshToken: response.refresh_token,
                        accessTokenExpires: Date.now() + ACCESS_TOKEN_TTL,
                        backendUserId: response.user.id,
                    };
                } catch {
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider && account?.provider !== 'credentials') {
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/api/oauth`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({
                                provider: account.provider,
                                email: user.email,
                                name: user.name,
                                avatar_url: user.image,
                            }),
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        user.accessToken = data.data.access_token;
                        user.refreshToken = data.data.refresh_token;
                        user.accessTokenExpires = Date.now() + ACCESS_TOKEN_TTL;
                        user.backendUserId = data.data.user.id;
                    } else {
                        console.error('Backend OAuth failed:', response.status, await response.text());
                        return false;
                    }
                } catch (error) {
                    console.error('OAuth backend sync failed:', error);
                    return false;
                }
            }

            return true;
        },

        async jwt({ token, user }) {
            if (user?.accessToken) {
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.accessTokenExpires = user.accessTokenExpires;
                token.backendUserId = user.backendUserId;
                return token;
            }

            if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) - REFRESH_BUFFER) {
                return token;
            }

            if (token.refreshToken) {
                const refreshed = await refreshAccessToken(token.refreshToken as string);
                if (refreshed) {
                    token.accessToken = refreshed.accessToken;
                    token.accessTokenExpires = refreshed.accessTokenExpires;
                    return token;
                }
            }

            token.error = 'RefreshTokenError';
            return token;
        },

        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.user.id = token.backendUserId || session.user.id;
            session.error = token.error;
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
});
