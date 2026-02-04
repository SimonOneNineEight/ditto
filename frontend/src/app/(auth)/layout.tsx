import type { Metadata } from 'next';
import { ThemeProvider } from '@/components';

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
            <div className="h-dvh flex">{children}</div>
        </ThemeProvider>
    );
}
