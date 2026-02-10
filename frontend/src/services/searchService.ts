import api from '@/lib/axios';
import type { GroupedSearchResponse } from '@/types/search';

const EMPTY_RESPONSE: GroupedSearchResponse = {
  applications: [],
  interviews: [],
  assessments: [],
  notes: [],
  total_count: 0,
  query: '',
};

export async function search(
  query: string,
  limit: number = 10
): Promise<GroupedSearchResponse> {
  if (!query || query.length < 3) {
    return { ...EMPTY_RESPONSE, query };
  }

  try {
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('limit', String(limit));

    const response = await api.get(`/api/search?${params.toString()}`);
    return response.data?.data || EMPTY_RESPONSE;
  } catch (error) {
    console.error('Search error:', error);
    return { ...EMPTY_RESPONSE, query };
  }
}
