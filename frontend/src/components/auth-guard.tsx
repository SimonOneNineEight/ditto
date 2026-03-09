'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { navigateTo } from '@/lib/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'loading') return;

        if (session?.error === 'RefreshTokenError') {
            signOut({ redirect: false }).then(() => {
                const loginUrl = `/login?error=SessionExpired&callbackUrl=${encodeURIComponent(pathname)}`;
                navigateTo(loginUrl);
            });
        }
    }, [session, status, pathname]);

    if (status === 'loading') {
        return null;
    }

    if (session?.error === 'RefreshTokenError') {
        return null;
    }

    return <>{children}</>;
}
