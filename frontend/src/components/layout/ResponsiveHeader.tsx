'use client';

import { useState } from 'react';
import { Suez_One } from 'next/font/google';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { NavSheet } from './NavSheet';
import { NotificationCenter } from '@/components/notification-center';
import { UserAvatar } from './UserAvatar';

const suezOne = Suez_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
});

export function ResponsiveHeader() {
    const breakpoint = useBreakpoint();
    const [navOpen, setNavOpen] = useState(false);

    if (breakpoint === 'desktop') {
        return null;
    }

    const isTablet = breakpoint === 'tablet';

    return (
        <>
            <header
                className={cn(
                    'flex items-center justify-between bg-card rounded-lg desktop:hidden',
                    isTablet ? 'px-6 py-3' : 'px-4 py-3'
                )}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setNavOpen(true)}
                    className="h-11 w-11"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-6 w-6" />
                </Button>

                <Link href="/" className="absolute left-1/2 -translate-x-1/2">
                    <span
                        className={cn(
                            suezOne.className,
                            'text-foreground',
                            isTablet ? 'text-[22px]' : 'text-xl'
                        )}
                    >
                        Ditto
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    <NotificationCenter />
                    <UserAvatar />
                </div>
            </header>

            <NavSheet open={navOpen} onOpenChange={setNavOpen} />
        </>
    );
}
