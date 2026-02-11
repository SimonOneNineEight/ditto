'use client';

import React, { useEffect, useState } from 'react';
import { Suez_One } from 'next/font/google';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Folder, Calendar, LayoutDashboard, Clock, File, X, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NavUser } from './nav-user';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { GlobalSearch } from '@/components/global-search';

const suezOne = Suez_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
});

const sidebarMenu = [
    {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'Applications',
        url: '/applications',
        icon: Folder,
    },
    {
        title: 'Interviews',
        url: '/interviews',
        icon: Calendar,
    },
    {
        title: 'Timeline',
        url: '/timeline',
        icon: Clock,
    },
    {
        title: 'Files',
        url: '/files',
        icon: File,
    },
];

const AppSidebar = () => {
    const { isMobile, setOpen, toggleSidebar } = useSidebar();
    const side = isMobile ? 'right' : 'left';
    const pathname = usePathname();
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        setOpen(!isMobile);
    }, [isMobile, setOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <Sidebar side={side}>
            <SidebarHeader className="relative px-3 pt-6 pb-2">
                {isMobile && (
                    <Button
                        variant="ghost"
                        hasIcon
                        iconPosition="only"
                        icon={<X />}
                        onClick={toggleSidebar}
                        className="absolute top-4 left-2"
                    />
                )}
                <Link href="/">
                    <h1
                        className={cn(
                            suezOne.className,
                            'text-center text-4xl text-foreground py-3'
                        )}
                    >
                        Ditto
                    </h1>
                </Link>
            </SidebarHeader>
            <SidebarContent className="px-3 gap-1">
                <Button
                    variant="outline"
                    onClick={() => setSearchOpen(true)}
                    className="w-full justify-between gap-2 bg-muted hover:bg-muted/80 text-muted-foreground mb-2"
                    hasIcon
                    iconPosition="left"
                    icon={<Search className="h-4 w-4" />}
                >
                    <span className="flex-1 text-left text-[13px] font-normal">Search...</span>
                    <kbd className="px-1.5 py-0.5 text-[11px] font-medium bg-background rounded">
                        ⌘K
                    </kbd>
                </Button>
                <nav className="flex flex-col gap-1">
                    {sidebarMenu.map((item) => {
                        const isActive =
                            item.url === '/'
                                ? pathname === item.url
                                : pathname.startsWith(item.url);
                        return (
                            <Link
                                key={item.title}
                                href={item.url}
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
            </SidebarContent>
            <SidebarFooter className="p-0">
                <NavUser />
            </SidebarFooter>
            <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </Sidebar>
    );
};

export default AppSidebar;
