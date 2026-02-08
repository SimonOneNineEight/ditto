import api from '@/lib/axios';
import type { Notification, NotificationPreferences, UpdateNotificationPreferencesRequest } from '@/types/notification';

export async function getNotifications(read?: boolean): Promise<Notification[]> {
    const params = new URLSearchParams();
    if (read !== undefined) {
        params.set('read', read.toString());
    }
    const queryString = params.toString();
    const url = queryString ? `/api/notifications?${queryString}` : '/api/notifications';
    const response = await api.get(url);
    return response.data?.data ?? [];
}

export async function getUnreadCount(): Promise<number> {
    const response = await api.get('/api/notifications/count');
    return response.data?.data?.unread_count ?? 0;
}

export async function markAsRead(id: string): Promise<Notification> {
    const response = await api.patch(`/api/notifications/${id}/read`);
    return response.data?.data;
}

export async function markAllAsRead(): Promise<number> {
    const response = await api.patch('/api/notifications/mark-all-read');
    return response.data?.data?.marked_count ?? 0;
}

export async function getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get('/api/users/notification-preferences');
    return response.data?.data;
}

export async function updatePreferences(prefs: UpdateNotificationPreferencesRequest): Promise<NotificationPreferences> {
    const response = await api.put('/api/users/notification-preferences', prefs);
    return response.data?.data;
}
