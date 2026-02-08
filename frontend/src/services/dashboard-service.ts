import api from '@/lib/axios';
import type { UpcomingItem, UpcomingFilterType } from '@/types/upcoming';
import type { ApplicationWithDetails } from '@/services/application-service';

export interface DashboardStats {
    total_applications: number;
    active_applications: number;
    interview_count: number;
    offer_count: number;
    status_counts: {
        saved: number;
        applied: number;
        interview: number;
        offer: number;
        rejected: number;
    };
    updated_at: string;
}

export async function getStats(): Promise<DashboardStats> {
    const response = await api.get('/api/dashboard/stats');
    return response.data?.data;
}

export async function getUpcomingItems(
    limit: number = 4,
    type: UpcomingFilterType = 'all'
): Promise<UpcomingItem[]> {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    if (type !== 'all') {
        params.set('type', type);
    }
    const response = await api.get(`/api/dashboard/upcoming?${params.toString()}`);
    return response.data?.data ?? [];
}

export async function getRecentApplications(limit: number = 4): Promise<ApplicationWithDetails[]> {
    const response = await api.get(`/api/applications/recent?limit=${limit}`);
    return response.data?.data?.applications ?? [];
}
