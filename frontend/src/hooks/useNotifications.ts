'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Notification } from '@/types/notification';
import * as notificationService from '@/services/notification-service';

export interface UseNotificationsOptions {
    pollingInterval?: number;
    enabled?: boolean;
}

export interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const POLLING_INTERVAL = 60000;

export const useNotifications = (options?: UseNotificationsOptions): UseNotificationsReturn => {
    const { pollingInterval = POLLING_INTERVAL, enabled = true } = options ?? {};

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const [notifs, count] = await Promise.all([
                notificationService.getNotifications(),
                notificationService.getUnreadCount()
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    }, []);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        await fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            throw err;
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            toast.success('All notifications marked as read');
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;

        fetchNotifications();

        intervalRef.current = setInterval(fetchUnreadCount, pollingInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, pollingInterval, fetchNotifications, fetchUnreadCount]);

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        refetch,
        markAsRead,
        markAllAsRead
    };
};
