'use client';

import { cn } from '@/lib/utils';
import type { TimelineFilterType, TimelineRangeFilter } from '@/types/timeline';

interface FilterChipProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            aria-label={`Filter by ${label}`}
            aria-pressed={active}
        >
            {label}
        </button>
    );
}

const typeFilters: { value: TimelineFilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'interviews', label: 'Interviews' },
    { value: 'assessments', label: 'Assessments' },
];

const rangeFilters: { value: TimelineRangeFilter; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Upcoming' },
];

interface TimelineFiltersProps {
    typeFilter: TimelineFilterType;
    rangeFilter: TimelineRangeFilter;
    onTypeChange: (type: TimelineFilterType) => void;
    onRangeChange: (range: TimelineRangeFilter) => void;
}

export function TimelineFilters({
    typeFilter,
    rangeFilter,
    onTypeChange,
    onRangeChange,
}: TimelineFiltersProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-12">
                    Type
                </span>
                <div className="flex gap-2">
                    {typeFilters.map((filter) => (
                        <FilterChip
                            key={filter.value}
                            label={filter.label}
                            active={typeFilter === filter.value}
                            onClick={() => onTypeChange(filter.value)}
                        />
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-12">
                    Range
                </span>
                <div className="flex gap-2">
                    {rangeFilters.map((filter) => (
                        <FilterChip
                            key={filter.value}
                            label={filter.label}
                            active={rangeFilter === filter.value}
                            onClick={() => onRangeChange(filter.value)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
