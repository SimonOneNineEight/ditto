'use client';

import { Calendar, FileText, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification, NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';

export interface NotificationItemProps {
    notification: Notification;
    onClick?: () => void;
}

function getIcon(type: NotificationType) {
    switch (type) {
        case 'interview_reminder':
            return Calendar;
        case 'assessment_deadline':
            return FileText;
        case 'system_alert':
        default:
            return Bell;
    }
}

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
    const Icon = getIcon(notification.type);
    const isUnread = !notification.read;

    return (
        <button
            onClick={onClick}
            className={cn(
                'flex w-full items-center gap-3 rounded-md px-4 py-3 text-left hover:bg-muted/50',
                isUnread && 'bg-primary/5'
            )}
        >
            <div className="flex h-5 w-5 items-center justify-center">
                {isUnread ? (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                ) : (
                    <span className="h-2 w-2" />
                )}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <Icon className={cn('h-4 w-4', isUnread ? 'text-foreground' : 'text-muted-foreground')} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span
                    className={cn(
                        'text-[13px]',
                        isUnread ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
                    )}
                >
                    {notification.title}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                    {notification.message}
                </span>
                <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </span>
            </div>
        </button>
    );
}
