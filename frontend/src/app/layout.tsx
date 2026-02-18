import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import AuthProvider from '@/providers/auth-provider';

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900',
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
};

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
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
