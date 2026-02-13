'use client';

import { cn } from '@/lib/utils';
import type { TimelineFilterType, TimelineRangeFilter } from '@/types/timeline';

interface FilterChipProps {
    label: string;
    shortLabel?: string;
    active: boolean;
    onClick: () => void;
}

function FilterChip({ label, shortLabel, active, onClick }: FilterChipProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            aria-label={`Filter by ${label}`}
            aria-pressed={active}
        >
            <span className="sm:hidden">{shortLabel || label}</span>
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

const typeFilters: { value: TimelineFilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'interviews', label: 'Interviews' },
    { value: 'assessments', label: 'Assessments' },
];

const rangeFilters: { value: TimelineRangeFilter; label: string; shortLabel: string }[] = [
    { value: 'today', label: 'Today', shortLabel: 'Today' },
    { value: 'week', label: 'This Week', shortLabel: 'Week' },
    { value: 'month', label: 'This Month', shortLabel: 'Month' },
    { value: 'all', label: 'All Upcoming', shortLabel: 'All' },
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
                <span className="text-sm font-medium text-muted-foreground w-12 flex-shrink-0">
                    Type
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
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
                <span className="text-sm font-medium text-muted-foreground w-12 flex-shrink-0">
                    Range
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
                    {rangeFilters.map((filter) => (
                        <FilterChip
                            key={filter.value}
                            label={filter.label}
                            shortLabel={filter.shortLabel}
                            active={rangeFilter === filter.value}
                            onClick={() => onRangeChange(filter.value)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
