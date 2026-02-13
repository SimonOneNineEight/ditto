'use client';

import { Suez_One } from 'next/font/google';
import { X, LayoutDashboard, Folder, Calendar, Clock, File, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { GlobalSearch } from '@/components/global-search';

const suezOne = Suez_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
});

const navItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Applications', url: '/applications', icon: Folder },
    { title: 'Interviews', url: '/interviews', icon: Calendar },
    { title: 'Timeline', url: '/timeline', icon: Clock },
    { title: 'Files', url: '/files', icon: File },
];

interface NavSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NavSheet({ open, onOpenChange }: NavSheetProps) {
    const pathname = usePathname();
    const breakpoint = useBreakpoint();
    const [searchOpen, setSearchOpen] = useState(false);

    const isTablet = breakpoint === 'tablet';
    const sheetWidth = isTablet ? 280 : 260;

    const handleNavClick = () => {
        onOpenChange(false);
    };

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="left"
                    className="p-0 w-[--sheet-width] [&>button]:hidden"
                    style={{ '--sheet-width': `${sheetWidth}px` } as React.CSSProperties}
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>

                    <div className="flex flex-col h-full">
                        {/* Logo and Close */}
                        <div className={cn(
                            'flex items-center justify-between',
                            isTablet ? 'px-3 pt-6 pb-5' : 'px-3 pt-5 pb-4'
                        )}>
                            <Link href="/" onClick={handleNavClick}>
                                <span className={cn(
                                    suezOne.className,
                                    'text-foreground text-2xl'
                                )}>
                                    Ditto
                                </span>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="h-10 w-10"
                                aria-label="Close navigation"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Search Trigger */}
                        <div className="px-3 mb-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchOpen(true);
                                    onOpenChange(false);
                                }}
                                className="w-full justify-start gap-2 bg-muted hover:bg-muted/80 text-muted-foreground"
                            >
                                <Search className="h-4 w-4" />
                                <span className="text-[13px] font-normal">Search...</span>
                            </Button>
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex flex-col gap-1 px-3 flex-1">
                            {navItems.map((item) => {
                                const isActive =
                                    item.url === '/'
                                        ? pathname === item.url
                                        : pathname.startsWith(item.url);
                                return (
                                    <Link
                                        key={item.title}
                                        href={item.url}
                                        onClick={handleNavClick}
                                        className={cn(
                                            'flex items-center gap-3 rounded-md px-4 py-3 text-sm transition-colors',
                                            isActive
                                                ? 'bg-primary text-foreground font-medium'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        )}
                                    >
                                        <item.icon className="h-[18px] w-[18px]" />
                                        <span>{item.title}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </SheetContent>
            </Sheet>

            <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </>
    );
}
