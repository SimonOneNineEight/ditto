import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/app/globals.css';
import { Navbar, ThemeProvider } from '@/components';
import AppSidebar from '@/components/sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import LayoutWrapper from '@/components/layout-wrapper';
import { Toaster } from '@/components/ui/sonner';
import { ResponsiveHeader } from '@/components/layout';
import { AuthGuard } from '@/components/auth-guard';
import { ErrorBoundary } from '@/components/error-boundary';
import { NetworkStatusMonitor } from '@/components/network-status-monitor';

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
                    <a
                        href="#main-content"
                        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground focus:border focus:rounded-md focus:m-2"
                        data-testid="skip-to-content"
                    >
                        Skip to main content
                    </a>
                    <SidebarProvider>
                        <AppSidebar />
                        <SidebarInset className="max-w-full min-w-0">
                            <div className="desktop:hidden px-4 pt-4">
                                <ResponsiveHeader />
                            </div>
                            <Navbar />
                            <AuthGuard>
                                <ErrorBoundary>
                                    <LayoutWrapper>{children}</LayoutWrapper>
                                </ErrorBoundary>
                            </AuthGuard>
                        </SidebarInset>
                    </SidebarProvider>
                    <Toaster />
                    <NetworkStatusMonitor />
                </ThemeProvider>
            </body>
        </html>
    );
}
