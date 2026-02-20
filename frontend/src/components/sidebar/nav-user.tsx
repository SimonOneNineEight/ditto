'use client';
import { ChevronDown, LogOut, Settings } from 'lucide-react';
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
import { useSidebar } from '@/components/ui/sidebar';
import { useSession, signOut } from 'next-auth/react';
import api from '@/lib/axios';

export function NavUser() {
    const { isMobile } = useSidebar();
    const { data: session } = useSession();

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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 px-4 py-3 border-t border-border text-left outline-none hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                <Avatar className="h-8 w-8 rounded-full bg-primary">
                    <AvatarFallback className="rounded-full bg-primary text-xs font-semibold">
                        {getInitials()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                    <span className="truncate text-sm font-medium text-foreground">
                        {session.user.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                        {session.user.email}
                    </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align="end"
                sideOffset={4}
            >
                <DropdownMenuLabel className="p-0 font-normal">
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
