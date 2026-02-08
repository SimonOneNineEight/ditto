'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getUpcomingItems } from '@/services/dashboard-service';
import type { UpcomingItem, UpcomingFilterType } from '@/types/upcoming';
import { UpcomingItemCard } from './UpcomingItemCard';

const filters: { value: UpcomingFilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'interviews', label: 'Interviews' },
    { value: 'assessments', label: 'Assessments' },
];

export function UpcomingWidget() {
    const [items, setItems] = useState<UpcomingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<UpcomingFilterType>('all');

    const fetchItems = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUpcomingItems(10, 'all');
            setItems(data);
        } catch (err) {
            console.error('Failed to fetch upcoming items:', err);
            setError('Failed to load upcoming events. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const filteredItems = items.filter((item) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'interviews') return item.type === 'interview';
        if (activeFilter === 'assessments') return item.type === 'assessment';
        return true;
    }).slice(0, 5);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <span className="text-lg font-semibold">Upcoming</span>
                {filters.map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => setActiveFilter(filter.value)}
                        className={cn(
                            'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            activeFilter === filter.value
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                        aria-label={`Filter by ${filter.label}`}
                        aria-pressed={activeFilter === filter.value}
                    >
                        {filter.label}
                    </button>
                ))}
                <Link
                    href="/applications"
                    className="ml-auto text-sm text-primary hover:underline transition-colors"
                >
                    View applications
                </Link>
            </div>

            {loading && (
                <div className="flex flex-col gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-[88px] w-full rounded-lg" />
                    ))}
                </div>
            )}

            {error && (
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchItems}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            )}

            {!loading && !error && filteredItems.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        No upcoming events
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Schedule an interview or add an assessment to see them here
                    </p>
                </div>
            )}

            {!loading && !error && filteredItems.length > 0 && (
                <div className="flex flex-col gap-3">
                    {filteredItems.map((item) => (
                        <UpcomingItemCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
