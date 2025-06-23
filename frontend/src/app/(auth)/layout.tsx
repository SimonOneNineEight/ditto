import type { Metadata } from 'next';
import { ThemeProvider } from '@/components';
import { AuthProvider } from '@/contexts/AuthContext';

export const metadata: Metadata = {
    title: 'Ditto - Authentication',
    description: 'Login or register for Ditto job tracker',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    {children}
                </div>
            </AuthProvider>
        </ThemeProvider>
    );
}