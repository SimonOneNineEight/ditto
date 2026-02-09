'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { Calendar, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getTimelineItems } from '@/services/timeline-service';
import type { TimelineItem as TimelineItemType, DateGroup } from '@/types/timeline';
import {
    TimelineFilters,
    TimelineDateGroup,
    useTimelineFilters,
} from './components';

const dateGroupOrder: DateGroup[] = [
    'overdue',
    'today',
    'tomorrow',
    'this_week',
    'later',
];

function groupItemsByDateGroup(
    items: TimelineItemType[]
): Map<DateGroup, TimelineItemType[]> {
    const groups = new Map<DateGroup, TimelineItemType[]>();

    for (const group of dateGroupOrder) {
        groups.set(group, []);
    }

    for (const item of items) {
        const group = groups.get(item.date_group);
        if (group) {
            group.push(item);
        }
    }

    return groups;
}

const TimelinePageSkeleton = () => (
    <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full" />
        </div>
    </div>
);

function TimelinePageContent() {
    const { filters, setTypeFilter, setRangeFilter } = useTimelineFilters();
    const [items, setItems] = useState<TimelineItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchKey, setRefetchKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const fetchItems = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getTimelineItems({
                    type: filters.type,
                    range: filters.range,
                    perPage: 50,
                });
                if (!cancelled) {
                    setItems(response.items);
                }
            } catch (err) {
                console.error('Failed to fetch timeline items:', err);
                if (!cancelled) {
                    setError('Failed to load timeline. Please try again.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchItems();

        return () => {
            cancelled = true;
        };
    }, [filters.type, filters.range, refetchKey]);

    const handleRetry = () => setRefetchKey((k) => k + 1);

    const groupedItems = useMemo(() => groupItemsByDateGroup(items), [items]);

    const hasItems = items.length > 0;
    const hasVisibleGroups = dateGroupOrder.some(
        (group) => (groupedItems.get(group)?.length ?? 0) > 0
    );

    return (
        <>
            <PageHeader
                title="Timeline"
                subtitle="Your upcoming interviews and assessments"
            />

            <div className="space-y-6">
                <TimelineFilters
                    typeFilter={filters.type}
                    rangeFilter={filters.range}
                    onTypeChange={setTypeFilter}
                    onRangeChange={setRangeFilter}
                />

                {loading && <TimelinePageSkeleton />}

                {error && (
                    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                        <AlertCircle className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{error}</p>
                        <Button variant="outline" size="sm" onClick={handleRetry}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>
                    </div>
                )}

                {!loading && !error && !hasVisibleGroups && (
                    <div className="flex flex-col items-center justify-center border border-border rounded-lg p-10 gap-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                            <Calendar className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-semibold">
                            No upcoming events
                        </h3>
                        <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                            {hasItems
                                ? 'No events match your current filters. Try adjusting your filter selection.'
                                : 'Schedule an interview or add an assessment to see them here.'}
                        </p>
                    </div>
                )}

                {!loading && !error && hasVisibleGroups && (
                    <div
                        className="flex flex-col gap-6"
                        role="list"
                        aria-live="polite"
                    >
                        {dateGroupOrder.map((group) => {
                            const groupItems = groupedItems.get(group) ?? [];
                            if (groupItems.length === 0) return null;
                            return (
                                <TimelineDateGroup
                                    key={group}
                                    group={group}
                                    items={groupItems}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

export default function TimelinePage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            }
        >
            <TimelinePageContent />
        </Suspense>
    );
}
