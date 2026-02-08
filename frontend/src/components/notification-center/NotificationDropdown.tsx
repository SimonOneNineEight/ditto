'use client';

import { BellOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';

export interface NotificationDropdownProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => Promise<void>;
    onMarkAllAsRead: () => Promise<void>;
    onClose?: () => void;
}

export function NotificationDropdown({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClose,
}: NotificationDropdownProps) {
    const router = useRouter();
    const hasUnread = notifications.some((n) => !n.read);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await onMarkAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
        onClose?.();
    };

    const handleMarkAllAsRead = async () => {
        await onMarkAllAsRead();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose?.();
        }
    };

    return (
        <div
            className="w-[400px] rounded-lg border bg-card shadow-lg"
            style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)' }}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-label="Notifications"
        >
            <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                {hasUnread && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        Mark all as read
                    </button>
                )}
            </div>
            {notifications.length === 0 ? (
                <div className="flex h-[180px] flex-col items-center justify-center gap-3 px-6 py-6">
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">No notifications</span>
                    <span className="text-center text-xs text-muted-foreground">
                        You&apos;re all caught up! Check back later.
                    </span>
                </div>
            ) : (
                <div className="max-h-[400px] overflow-y-auto" role="list">
                    {notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClick={() => handleNotificationClick(notification)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
