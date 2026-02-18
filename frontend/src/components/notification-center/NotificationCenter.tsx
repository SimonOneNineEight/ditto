'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from './NotificationBell';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const bellRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications();

    const close = useCallback(() => {
        setIsOpen(false);
        // Return focus to the bell trigger
        bellRef.current?.querySelector('button')?.focus();
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                close();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, close]);

    const handleOpen = () => {
        if (!isOpen) {
            refetch();
        }
        setIsOpen(!isOpen);
    };

    return (
        <div ref={containerRef} className="relative" data-testid="notification-center">
            <div ref={bellRef}>
                <NotificationBell unreadCount={unreadCount} onClick={handleOpen} />
            </div>
            {isOpen && (
                <div className="fixed inset-x-4 top-16 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2">
                    <NotificationDropdown
                        notifications={notifications}
                        onMarkAsRead={markAsRead}
                        onMarkAllAsRead={markAllAsRead}
                        onClose={close}
                    />
                </div>
            )}
        </div>
    );
}
