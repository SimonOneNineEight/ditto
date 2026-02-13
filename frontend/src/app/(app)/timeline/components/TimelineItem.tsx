'use client';

import Link from 'next/link';
import { Calendar, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineItem as TimelineItemType } from '@/types/timeline';
import type { UrgencyLevel } from '@/types/upcoming';
import { format } from 'date-fns';

export interface TimelineItemProps {
    item: TimelineItemType;
}

const badgeStyles: Record<UrgencyLevel, string> = {
    overdue: 'bg-[#991b1b] text-white',
    today: 'bg-[#14532d] text-white',
    upcoming: 'bg-[#1e3a5f] text-white',
    scheduled: 'bg-[#3a4043] text-white',
};

export function TimelineItem({ item }: TimelineItemProps) {
    const urgency = item.countdown.urgency;
    const Icon = item.type === 'interview' ? Calendar : Code;
    const formattedDate = format(new Date(item.due_date), 'MMM d, yyyy');

    return (
        <Link
            href={item.link}
            className={cn(
                'flex items-start sm:items-center gap-3 sm:gap-4 rounded-lg border border-border bg-card p-3 sm:p-4 transition-colors',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label={`${item.title} at ${item.company_name} - ${item.countdown.text}`}
        >
            <div
                className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    item.type === 'interview'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-accent/10 text-accent'
                )}
            >
                <Icon className="h-5 w-5" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <span
                        className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase',
                            item.type === 'interview'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-accent/10 text-accent'
                        )}
                    >
                        {item.type}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                        {item.company_name}
                    </span>
                </div>
                <span className="text-sm font-semibold line-clamp-2 sm:truncate">
                    {item.title}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                        {formattedDate}
                    </span>
                    <span
                        className={cn(
                            'sm:hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                            badgeStyles[urgency]
                        )}
                        aria-label={`Due ${item.countdown.text}`}
                    >
                        {item.countdown.text}
                    </span>
                </div>
            </div>

            <span
                className={cn(
                    'hidden sm:inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                    badgeStyles[urgency]
                )}
                aria-label={`Due ${item.countdown.text}`}
            >
                {item.countdown.text}
            </span>
        </Link>
    );
}
