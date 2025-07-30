import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { authService } from './services/auth-service';

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        GitHub,
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
    pages: {
        signIn: '/login',
    },
});
