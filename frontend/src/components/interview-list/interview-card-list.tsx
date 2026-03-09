'use client';

import Link from 'next/link';
import { format, parseISO, isToday, startOfDay, differenceInDays, isPast } from 'date-fns';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    type InterviewListItem,
    getInterviewTypeShortLabel,
} from '@/services/interview-service';

interface InterviewCardListProps {
    interviews: InterviewListItem[];
}

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

    const days = differenceInDays(interviewDate, today);
    if (days === 1) {
        return { label: 'Tomorrow', variant: 'soon' };
    }
    if (days > 0 && days <= 7) {
        return { label: `in ${days}d`, variant: 'soon' };
    }

    return { label: 'Scheduled', variant: 'scheduled' };
}

function getCardBorderClass(status: string, scheduledDate: string, outcome?: string): string {
    if (status === 'cancelled' || status === 'completed' || outcome) {
        return 'border-l-transparent opacity-60';
    }

    const interviewDate = startOfDay(parseISO(scheduledDate));
    const today = startOfDay(new Date());

    if (isToday(interviewDate)) {
        return 'border-l-[#f97316]';
    }

    const daysUntil = differenceInDays(interviewDate, today);
    if (daysUntil > 0 && daysUntil <= 7) {
        return 'border-l-primary';
    }

    return 'border-l-transparent';
}

function InterviewCard({ interview }: { interview: InterviewListItem }) {
    const displayStatus = getInterviewDisplayStatus(interview.status, interview.scheduled_date, interview.outcome);
    const borderClass = getCardBorderClass(interview.status, interview.scheduled_date, interview.outcome);
    const formattedDate = format(parseISO(interview.scheduled_date), 'MMM d');

    return (
        <Link href={`/interviews/${interview.id}`}>
            <div
                className={cn(
                    'rounded-lg border border-border bg-card p-3 space-y-1.5',
                    'border-l-4',
                    borderClass,
                    'hover:bg-accent/50 transition-colors'
                )}
            >
                {/* Top Row: Company + Status */}
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">
                        {interview.company_name}
                    </span>
                    <Badge variant={displayStatus.variant} className="flex-shrink-0">
                        {displayStatus.label}
                    </Badge>
                </div>

                {/* Position */}
                <p className="text-xs text-muted-foreground truncate">
                    {interview.job_title}
                </p>

                {/* Meta Row: Round · Type · Date */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Round {interview.round_number}</span>
                    <span>·</span>
                    <Badge
                        variant={
                            interview.interview_type as
                                | 'phone_screen'
                                | 'technical'
                                | 'behavioral'
                                | 'onsite'
                                | 'panel'
                                | 'other'
                        }
                        className="text-[10px] px-1.5 py-0"
                    >
                        {getInterviewTypeShortLabel(interview.interview_type)}
                    </Badge>
                    <span>·</span>
                    <span>{formattedDate}</span>
                </div>
            </div>
        </Link>
    );
}

export function InterviewCardList({ interviews }: InterviewCardListProps) {
    if (interviews.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No interviews match the current filter
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {interviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
            ))}
        </div>
    );
}
