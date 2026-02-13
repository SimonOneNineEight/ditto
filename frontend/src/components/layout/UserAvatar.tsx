'use client';

import { BadgeCheck, LogOut, Settings } from 'lucide-react';
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
import { useSession, signOut } from 'next-auth/react';
import { useBreakpoint } from '@/hooks/use-breakpoint';

export function UserAvatar() {
    const { data: session } = useSession();
    const breakpoint = useBreakpoint();

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
    const dropdownWidth = isMobile ? 'calc(100vw - 32px)' : '180px';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="h-11 w-11 flex items-center justify-center rounded-md hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="User menu"
                >
                    <Avatar className="h-8 w-8 rounded-full bg-primary">
                        <AvatarFallback className="rounded-full bg-primary text-xs font-semibold">
                            {getInitials()}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="rounded-lg"
                style={{ width: dropdownWidth }}
                align="end"
                sideOffset={8}
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
                    <DropdownMenuItem>
                        <BadgeCheck />
                        Account
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings">
                            <Settings />
                            Settings
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
