'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
    format,
    parseISO,
    isPast,
    isToday,
    isTomorrow,
    differenceInDays,
    startOfDay,
} from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    InterviewListItem,
    getInterviewTypeShortLabel,
} from '@/services/interview-service';

export interface ColumnMeta {
    className?: string;
}

const formatDate = (dateStr: string) => {
    try {
        return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
        return dateStr;
    }
};

function getCountdownText(
    scheduledDate: string,
    scheduledTime?: string,
    outcome?: string
): string {
    const interviewDate = startOfDay(parseISO(scheduledDate));
    const today = startOfDay(new Date());

    if (outcome) {
        return outcome.charAt(0).toUpperCase() + outcome.slice(1);
    }

    // Check isToday and isTomorrow BEFORE isPast (since today is technically "past" midnight)
    if (isToday(interviewDate)) {
        return 'Today';
    }

    if (isTomorrow(interviewDate)) {
        return 'Tomorrow';
    }

    // Past interviews without outcome go to Needs Feedback section
    if (isPast(interviewDate) && !outcome) {
        return '';
    }

    const days = differenceInDays(interviewDate, today);
    if (days > 0 && days <= 7) {
        return `in ${days}d`;
    }

    return '—';
}

type BadgeType = 'today' | 'tomorrow' | 'soon' | 'none';

function getBadgeType(countdown: string): BadgeType {
    if (countdown === 'Today') return 'today';
    if (countdown === 'Tomorrow') return 'tomorrow';
    if (countdown.includes('d')) return 'soon';
    return 'none';
}

function StatusBadge({ countdown }: { countdown: string }) {
    const badgeType = getBadgeType(countdown);

    if (badgeType === 'none' || countdown === '—') {
        return <span className="text-muted-foreground text-sm">{countdown}</span>;
    }

    const variant = badgeType === 'today' ? 'today' : 'soon';

    return (
        <Badge variant={variant}>
            {countdown}
        </Badge>
    );
}

export function getRowBorderClass(scheduledDate: string, outcome?: string): string {
    const interviewDate = startOfDay(parseISO(scheduledDate));
    const today = startOfDay(new Date());

    if (outcome && isPast(interviewDate)) {
        return 'opacity-60';
    }

    if (isToday(interviewDate)) {
        return 'border-l-4 border-l-[#f97316]';
    }

    const daysUntil = differenceInDays(interviewDate, today);
    if (daysUntil > 0 && daysUntil <= 7) {
        return 'border-l-4 border-l-primary';
    }

    return '';
}

export const columns: (ColumnDef<InterviewListItem, unknown> & {
    meta?: ColumnMeta;
})[] = [
    {
        accessorKey: 'company_name',
        header: 'Company',
        cell: ({ row }) => {
            return <span className="font-medium text-sm">{row.original.company_name}</span>;
        },
        meta: {
            className: 'w-[12%]',
        },
    },
    {
        accessorKey: 'job_title',
        header: 'Position',
        cell: ({ row }) => {
            return <span className="text-sm">{row.original.job_title}</span>;
        },
        meta: {
            className: 'w-[28%]',
        },
    },
    {
        accessorKey: 'round_number',
        header: 'Round',
        cell: ({ row }) => {
            return <span className="text-muted-foreground text-[13px]">Round {row.original.round_number}</span>;
        },
        meta: {
            className: 'w-[8%]',
        },
    },
    {
        accessorKey: 'interview_type',
        header: 'Type',
        cell: ({ row }) => {
            const interviewType = row.original.interview_type as 'phone_screen' | 'technical' | 'behavioral' | 'onsite' | 'panel' | 'other';
            return (
                <Badge variant={interviewType}>
                    {getInterviewTypeShortLabel(row.original.interview_type)}
                </Badge>
            );
        },
        meta: {
            className: 'w-[12%]',
        },
    },
    {
        accessorKey: 'scheduled_date',
        header: 'Date',
        cell: ({ row }) => {
            return <span className="text-muted-foreground text-[13px]">{formatDate(row.original.scheduled_date)}</span>;
        },
        meta: {
            className: 'w-[12%]',
        },
    },
    {
        accessorKey: 'duration_minutes',
        header: 'Duration',
        cell: ({ row }) => {
            const duration = row.original.duration_minutes;
            return duration ? (
                <span className="text-muted-foreground text-[13px]">{duration} min</span>
            ) : (
                <span className="text-muted-foreground text-[13px]">—</span>
            );
        },
        meta: {
            className: 'w-[10%]',
        },
    },
    {
        id: 'countdown',
        header: 'Status',
        cell: ({ row }) => {
            const countdown = getCountdownText(
                row.original.scheduled_date,
                row.original.scheduled_time,
                row.original.outcome
            );
            if (!countdown) return null;
            return <StatusBadge countdown={countdown} />;
        },
        meta: {
            className: 'w-[10%]',
        },
    },
    {
        id: 'action',
        header: 'Actions',
        cell: () => {
            return (
                <div className="flex items-center gap-2">
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive cursor-pointer" />
                </div>
            );
        },
        meta: {
            className: 'w-[8%]',
        },
    },
];
