'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from './NotificationBell';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleOpen = () => {
        if (!isOpen) {
            refetch();
        }
        setIsOpen(!isOpen);
    };

    return (
        <div ref={containerRef} className="relative">
            <NotificationBell unreadCount={unreadCount} onClick={handleOpen} />
            {isOpen && (
                <div className="absolute right-0 top-full z-50 mt-2">
                    <NotificationDropdown
                        notifications={notifications}
                        onMarkAsRead={markAsRead}
                        onMarkAllAsRead={markAllAsRead}
                        onClose={() => setIsOpen(false)}
                    />
                </div>
            )}
        </div>
    );
}
