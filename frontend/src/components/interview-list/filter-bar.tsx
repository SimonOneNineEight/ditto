'use client';

import { cn } from '@/lib/utils';
import { type InterviewFilter } from '@/services/interview-service';

interface FilterBarProps {
    currentFilter: InterviewFilter;
    onFilterChange: (filter: InterviewFilter) => void;
    totalCount: number;
}

const FILTER_OPTIONS: { value: InterviewFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
];

export function FilterBar({
    currentFilter,
    onFilterChange,
    totalCount,
}: FilterBarProps) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">
                Showing {totalCount} interview{totalCount !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
                {FILTER_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onFilterChange(option.value)}
                        className={cn(
                            'px-3 py-1.5 text-[13px] font-medium rounded transition-colors',
                            currentFilter === option.value
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground hover:bg-muted/80'
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export type { InterviewFilter };
