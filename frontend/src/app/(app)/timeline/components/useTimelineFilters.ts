'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { TimelineFilterType, TimelineRangeFilter } from '@/types/timeline';

export interface TimelineFiltersState {
    type: TimelineFilterType;
    range: TimelineRangeFilter;
}

export function useTimelineFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const filters: TimelineFiltersState = useMemo(() => {
        const typeParam = searchParams.get('type');
        const rangeParam = searchParams.get('range');

        let type: TimelineFilterType = 'all';
        if (
            typeParam === 'all' ||
            typeParam === 'interviews' ||
            typeParam === 'assessments'
        ) {
            type = typeParam;
        }

        let range: TimelineRangeFilter = 'all';
        if (
            rangeParam === 'today' ||
            rangeParam === 'week' ||
            rangeParam === 'month' ||
            rangeParam === 'all'
        ) {
            range = rangeParam;
        }

        return { type, range };
    }, [searchParams]);

    const setTypeFilter = useCallback(
        (type: TimelineFilterType) => {
            const params = new URLSearchParams(searchParams.toString());
            if (type === 'all') {
                params.delete('type');
            } else {
                params.set('type', type);
            }
            const queryString = params.toString();
            router.push(queryString ? `/timeline?${queryString}` : '/timeline');
        },
        [router, searchParams]
    );

    const setRangeFilter = useCallback(
        (range: TimelineRangeFilter) => {
            const params = new URLSearchParams(searchParams.toString());
            if (range === 'all') {
                params.delete('range');
            } else {
                params.set('range', range);
            }
            const queryString = params.toString();
            router.push(queryString ? `/timeline?${queryString}` : '/timeline');
        },
        [router, searchParams]
    );

    return {
        filters,
        setTypeFilter,
        setRangeFilter,
    };
}
