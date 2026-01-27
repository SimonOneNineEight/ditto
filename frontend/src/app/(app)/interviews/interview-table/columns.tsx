'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
    InterviewListItem,
    getInterviewTypeLabel,
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

const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return format(date, 'h:mm a');
    } catch {
        return timeStr;
    }
};

export const columns: (ColumnDef<InterviewListItem, unknown> & {
    meta?: ColumnMeta;
})[] = [
    {
        accessorKey: 'company_name',
        header: 'Company',
        meta: {
            className: 'w-[18%]',
        },
    },
    {
        accessorKey: 'job_title',
        header: 'Position',
        meta: {
            className: 'w-[18%]',
        },
    },
    {
        accessorKey: 'round_number',
        header: 'Round',
        cell: ({ row }) => {
            return <span>Round {row.original.round_number}</span>;
        },
        meta: {
            className: 'w-[10%]',
        },
    },
    {
        accessorKey: 'interview_type',
        header: 'Type',
        cell: ({ row }) => {
            return (
                <Badge variant="secondary">
                    {getInterviewTypeLabel(row.original.interview_type)}
                </Badge>
            );
        },
        meta: {
            className: 'w-[15%]',
        },
    },
    {
        accessorKey: 'scheduled_date',
        header: 'Date',
        cell: ({ row }) => {
            const date = formatDate(row.original.scheduled_date);
            const time = formatTime(row.original.scheduled_time);
            return (
                <div>
                    <span>{date}</span>
                    {time && (
                        <span className="text-muted-foreground ml-2">{time}</span>
                    )}
                </div>
            );
        },
        meta: {
            className: 'w-[20%]',
        },
    },
    {
        accessorKey: 'duration_minutes',
        header: 'Duration',
        cell: ({ row }) => {
            const duration = row.original.duration_minutes;
            return duration ? <span>{duration} min</span> : <span>-</span>;
        },
        meta: {
            className: 'w-[10%]',
        },
    },
];
