'use client';

import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationBellProps {
    unreadCount: number;
    onClick?: () => void;
    className?: string;
}

export function NotificationBell({ unreadCount, onClick, className }: NotificationBellProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                className
            )}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            data-testid="notification-bell"
        >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && (
                <span
                    className="absolute -top-0.5 right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
                    aria-live="polite"
                >
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
}
