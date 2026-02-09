'use client';

import { cn } from '@/lib/utils';
import type { TimelineItem as TimelineItemType, DateGroup } from '@/types/timeline';
import { TimelineItem } from './TimelineItem';

interface TimelineDateGroupProps {
    group: DateGroup;
    items: TimelineItemType[];
}

const groupLabels: Record<DateGroup, string> = {
    overdue: 'Overdue',
    today: 'Today',
    tomorrow: 'Tomorrow',
    this_week: 'This Week',
    later: 'Later',
};

export function TimelineDateGroup({ group, items }: TimelineDateGroupProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3">
            <h3
                className={cn(
                    'text-sm font-semibold',
                    group === 'overdue'
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                )}
            >
                {groupLabels[group]}
            </h3>
            <div className="flex flex-col gap-3">
                {items.map((item) => (
                    <TimelineItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
