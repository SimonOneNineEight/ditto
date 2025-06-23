import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/app/globals.css';
import { Navbar, ThemeProvider } from '@/components';
import { AuthProvider } from '@/contexts/AuthContext';
import AppSidebar from '@/components/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import LayoutWrapper from '@/components/LayoutWrapper';

const geistSans = localFont({
    src: '../fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
});
const geistMono = localFont({
    src: '../fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
});

export const metadata: Metadata = {
    title: 'Ditto - Job Tracker',
    description: 'A simple job tracker app',
    icons: {
        icon: '/favicon.svg',
        shortcut: '/favicon.svg',
        apple: '/favicon.svg',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased max-w-[100vw]`}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <SidebarProvider>
                            <AppSidebar />
                            <SidebarInset className="max-w-full min-w-0 ">
                                <Navbar />
                                <LayoutWrapper>{children}</LayoutWrapper>
                            </SidebarInset>
                        </SidebarProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
