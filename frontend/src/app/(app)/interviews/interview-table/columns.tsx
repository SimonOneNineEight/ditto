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

function getInterviewDisplayStatus(
    status: string,
    scheduledDate: string,
    outcome?: string
): { label: string; variant: 'scheduled' | 'completed' | 'cancelled' | 'awaiting_outcome' | 'today' | 'soon' } {
    if (status === 'cancelled') {
        return { label: 'Cancelled', variant: 'cancelled' };
    }

    if (status === 'completed' || outcome) {
        return { label: outcome ? outcome.charAt(0).toUpperCase() + outcome.slice(1) : 'Completed', variant: 'completed' };
    }

    const interviewDate = startOfDay(parseISO(scheduledDate));
    const today = startOfDay(new Date());

    if (isPast(interviewDate) && !isToday(interviewDate)) {
        return { label: 'Awaiting Outcome', variant: 'awaiting_outcome' };
    }

    if (isToday(interviewDate)) {
        return { label: 'Today', variant: 'today' };
    }

    if (isTomorrow(interviewDate)) {
        return { label: 'Tomorrow', variant: 'soon' };
    }

    const days = differenceInDays(interviewDate, today);
    if (days > 0 && days <= 7) {
        return { label: `in ${days}d`, variant: 'soon' };
    }

    return { label: 'Scheduled', variant: 'scheduled' };
}

function StatusBadge({ status, scheduledDate, outcome }: { status: string; scheduledDate: string; outcome?: string }) {
    const displayStatus = getInterviewDisplayStatus(status, scheduledDate, outcome);
    return (
        <Badge variant={displayStatus.variant}>
            {displayStatus.label}
        </Badge>
    );
}

export function getRowBorderClass(scheduledDate: string, outcome?: string, status?: string): string {
    if (status === 'cancelled' || status === 'completed' || outcome) {
        return 'opacity-60';
    }

    const interviewDate = startOfDay(parseISO(scheduledDate));
    const today = startOfDay(new Date());

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
            className: 'w-[10%] hidden lg:table-cell',
        },
    },
    {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
            return (
                <StatusBadge
                    status={row.original.status}
                    scheduledDate={row.original.scheduled_date}
                    outcome={row.original.outcome}
                />
            );
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
            className: 'w-[8%] hidden lg:table-cell',
        },
    },
];
