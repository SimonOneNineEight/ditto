'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const OFFLINE_TOAST_ID = 'network-offline';

export function NetworkStatusMonitor() {
    const wasOfflineRef = useRef(false);

    useEffect(() => {
        const handleOffline = () => {
            wasOfflineRef.current = true;
            toast.error('Connection lost. Changes will sync when reconnected.', {
                id: OFFLINE_TOAST_ID,
                duration: Infinity,
            });
        };

        const handleOnline = () => {
            if (wasOfflineRef.current) {
                wasOfflineRef.current = false;
                toast.dismiss(OFFLINE_TOAST_ID);
                toast.success('Connection restored', { duration: 3000 });
            }
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        if (!navigator.onLine) {
            handleOffline();
        }

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    return null;
}
