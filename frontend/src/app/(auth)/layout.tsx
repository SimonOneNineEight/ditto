import type { Metadata } from 'next';
import { ThemeProvider } from '@/components';
import { AuthProvider } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Suez_One } from 'next/font/google';

export const metadata: Metadata = {
    title: 'Ditto - Authentication',
    description: 'Login or register for Ditto job tracker',
};

const suezOne = Suez_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
});

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
                <div className="h-dvh grid grid-rows-[auto_1fr]">
                    <Link href="/" className="block m-4">
                        <h1 className={suezOne.className}>Ditto</h1>
                    </Link>
                    <div className="flex items-center justify-center bg-background">
                        {children}
                    </div>
                </div>
            </AuthProvider>
        </ThemeProvider>
    );
}

