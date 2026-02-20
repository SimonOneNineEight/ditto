'use client';

import { useState } from 'react';
import { LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { useSession, signOut } from 'next-auth/react';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import api from '@/lib/axios';

export function UserAvatar() {
    const { data: session } = useSession();
    const breakpoint = useBreakpoint();
    const [sheetOpen, setSheetOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await api.post('/api/logout');
        } catch (error) {
            console.warn('Backend logout failed, proceeding with client-side signOut:', error instanceof Error ? error.message : 'Unknown error');
        }
        await signOut({ callbackUrl: '/login' });
    };

    if (!session?.user) {
        return null;
    }

    const getInitials = () => {
        const name = session.user?.name;
        const email = session.user?.email;
        if (name) {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            }
            return name[0].toUpperCase();
        }
        return email?.[0]?.toUpperCase() || '?';
    };

    const isMobile = breakpoint === 'mobile';

    const avatarButton = (
        <button
            className="h-11 w-11 flex items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-testid="user-avatar"
            aria-label="User menu"
            onClick={isMobile ? () => setSheetOpen(true) : undefined}
        >
            <Avatar className="h-8 w-8 rounded-full bg-primary">
                <AvatarFallback className="rounded-full bg-primary text-xs font-semibold">
                    {getInitials()}
                </AvatarFallback>
            </Avatar>
        </button>
    );

    const userInfo = (
        <div className="flex items-center gap-3 px-2 py-2 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-full bg-primary">
                <AvatarFallback className="rounded-full bg-primary text-xs font-semibold">
                    {getInitials()}
                </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                <span className="truncate font-medium">
                    {session.user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                    {session.user.email}
                </span>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <>
                {avatarButton}
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetContent side="top" className="rounded-b-xl">
                        <SheetHeader className="sr-only">
                            <SheetTitle>User menu</SheetTitle>
                        </SheetHeader>
                        <div className="pt-2 pb-2">
                            {userInfo}
                            <div className="my-2 h-px bg-border" />
                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/settings"
                                    onClick={() => setSheetOpen(false)}
                                    className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted transition-colors"
                                >
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Link>
                            </div>
                            <div className="my-2 h-px bg-border" />
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-muted transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Log out
                            </button>
                        </div>
                    </SheetContent>
                </Sheet>
            </>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {avatarButton}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="rounded-lg w-[180px]"
                align="end"
                sideOffset={8}
            >
                <DropdownMenuLabel className="p-0 font-normal">
                    {userInfo}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href="/settings">
                            <Settings />
                            Settings
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
