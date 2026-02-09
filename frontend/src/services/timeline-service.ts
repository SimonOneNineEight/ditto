import api from '@/lib/axios';
import type {
    TimelineResponse,
    TimelineFilterType,
    TimelineRangeFilter,
} from '@/types/timeline';

export interface TimelineParams {
    type?: TimelineFilterType;
    range?: TimelineRangeFilter;
    page?: number;
    perPage?: number;
}

export async function getTimelineItems(
    params: TimelineParams = {}
): Promise<TimelineResponse> {
    const { type = 'all', range = 'all', page = 1, perPage = 20 } = params;

    const searchParams = new URLSearchParams();
    searchParams.set('type', type);
    searchParams.set('range', range);
    searchParams.set('page', page.toString());
    searchParams.set('per_page', perPage.toString());

    const response = await api.get(`/api/timeline?${searchParams.toString()}`);
    return (
        response.data?.data ?? {
            items: [],
            meta: { page: 1, per_page: 20, total_items: 0, total_pages: 0 },
        }
    );
}
