'use client';

import Link from 'next/link';
import { Calendar, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UpcomingItem, UrgencyLevel } from '@/types/upcoming';
import { format } from 'date-fns';

export interface UpcomingItemCardProps {
    item: UpcomingItem;
}

const urgencyStyles: Record<UrgencyLevel, { border: string; badge: string; icon: string; date: string }> = {
    overdue: {
        border: 'border-[#7f1d1d]',
        badge: 'bg-[#991b1b] text-white',
        icon: 'bg-[#5c1a1a] text-red-400',
        date: 'text-red-400',
    },
    today: {
        border: 'border-[#16a34a]',
        badge: 'bg-[#14532d] text-white',
        icon: 'bg-[#14532d] text-green-400',
        date: 'text-green-400',
    },
    upcoming: {
        border: 'border-primary',
        badge: 'bg-primary/20 text-primary',
        icon: 'bg-primary/10 text-primary',
        date: 'text-primary',
    },
    scheduled: {
        border: 'border-border',
        badge: 'bg-muted text-muted-foreground',
        icon: 'bg-muted text-muted-foreground',
        date: 'text-muted-foreground',
    },
};

export function UpcomingItemCard({ item }: UpcomingItemCardProps) {
    const urgency = item.countdown.urgency;
    const styles = urgencyStyles[urgency];
    const Icon = item.type === 'interview' ? Calendar : Code;

    const formattedDate = format(new Date(item.due_date), 'MMM d, yyyy');

    return (
        <Link
            href={item.link}
            className={cn(
                'flex items-center gap-4 rounded-lg border p-4 transition-colors',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                styles.border
            )}
            aria-label={`${item.title} at ${item.company_name} - ${item.countdown.text}`}
        >
            <div
                className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    styles.icon
                )}
            >
                <Icon className="h-5 w-5" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
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
                <span className="truncate text-sm font-semibold">{item.title}</span>
                <span className={cn('text-xs', styles.date)}>{formattedDate}</span>
            </div>

            <span
                className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                    styles.badge
                )}
                aria-label={`Due ${item.countdown.text}`}
            >
                {item.countdown.text}
            </span>
        </Link>
    );
}
