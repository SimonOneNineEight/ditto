import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { authService } from './services/auth-service';

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
                    };
                } catch (error) {
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
                            headers: { 'Content-Type': 'application/json' },
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
                    }
                } catch (error) {
                    console.error('OAuth backend sync failed:', error);
                    return false;
                }
            }

            return true;
        },

        async jwt({ token, user }) {
            // Store backend tokens in JWT
            if (user?.accessToken) {
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.backendUserId = user.backendUserId;
            }
            return token;
        },

        async session({ session, token }) {
            // Make tokens available in session
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.user.id = token.backendUserId || session.user.id;
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
});
