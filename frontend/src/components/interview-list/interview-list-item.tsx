'use client';

import Link from 'next/link';
import {
    format,
    parseISO,
    isPast,
    isToday,
    isTomorrow,
    differenceInDays,
    differenceInHours,
    startOfDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    type InterviewListItem as InterviewListItemType,
    getInterviewTypeLabel,
} from '@/services/interview-service';

interface InterviewListItemProps {
    interview: InterviewListItemType;
}

function getCountdownText(
    scheduledDate: string,
    scheduledTime?: string,
    outcome?: string
): string {
    const interviewDate = startOfDay(parseISO(scheduledDate));
    const today = startOfDay(new Date());

    if (isPast(interviewDate) && !outcome) {
        return 'Overdue';
    }

    if (isToday(interviewDate)) {
        if (scheduledTime) {
            const [hours, minutes] = scheduledTime.split(':').map(Number);
            const interviewDateTime = new Date();
            interviewDateTime.setHours(hours, minutes, 0, 0);
            const hoursUntil = differenceInHours(interviewDateTime, new Date());
            if (hoursUntil > 0) {
                return `in ${hoursUntil} hour${hoursUntil === 1 ? '' : 's'}`;
            }
            return 'Starting soon';
        }
        return 'Today';
    }

    if (isTomorrow(interviewDate)) {
        return 'Tomorrow';
    }

    const days = differenceInDays(interviewDate, today);
    if (days > 0) {
        return `in ${days} day${days === 1 ? '' : 's'}`;
    }

    return '';
}

function getUrgencyStyles(scheduledDate: string, outcome?: string): string {
    const interviewDate = startOfDay(parseISO(scheduledDate));
    const today = startOfDay(new Date());

    if (isPast(interviewDate) && !outcome) {
        return 'border-l-4 border-l-destructive bg-destructive/5';
    }

    if (isToday(interviewDate)) {
        return 'border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20';
    }

    const daysUntil = differenceInDays(interviewDate, today);
    if (daysUntil > 0 && daysUntil <= 7) {
        return 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }

    return 'border-l-4 border-l-transparent';
}

function getInterviewTypeBadgeVariant(
    type: string
): 'default' | 'secondary' | 'outline' {
    switch (type) {
        case 'technical':
            return 'default';
        case 'behavioral':
            return 'secondary';
        default:
            return 'outline';
    }
}

export function InterviewListItem({ interview }: InterviewListItemProps) {
    const formattedDate = format(parseISO(interview.scheduled_date), 'MMM d, yyyy');
    const formattedTime = interview.scheduled_time
        ? format(
              new Date(`2000-01-01T${interview.scheduled_time}`),
              'h:mm a'
          )
        : null;
    const countdown = getCountdownText(
        interview.scheduled_date,
        interview.scheduled_time,
        interview.outcome
    );
    const urgencyStyles = getUrgencyStyles(
        interview.scheduled_date,
        interview.outcome
    );

    return (
        <Link
            href={`/interviews/${interview.id}`}
            className={cn(
                'block p-4 rounded-lg border hover:bg-muted/50 transition-colors',
                urgencyStyles
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                            {interview.company_name}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground truncate">
                            {interview.job_title}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                            Round {interview.round_number}
                        </span>
                        <Badge variant={getInterviewTypeBadgeVariant(interview.interview_type)}>
                            {getInterviewTypeLabel(interview.interview_type)}
                        </Badge>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="text-sm font-medium">{formattedDate}</div>
                    {formattedTime && (
                        <div className="text-sm text-muted-foreground">
                            {formattedTime}
                        </div>
                    )}
                    {countdown && (
                        <div
                            className={cn(
                                'text-xs font-medium mt-1',
                                countdown === 'Overdue' && 'text-destructive',
                                countdown === 'Today' ||
                                    countdown.includes('hour')
                                    ? 'text-orange-600 dark:text-orange-400'
                                    : '',
                                countdown === 'Tomorrow' ||
                                    countdown.includes('day')
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : ''
                            )}
                        >
                            {countdown}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
