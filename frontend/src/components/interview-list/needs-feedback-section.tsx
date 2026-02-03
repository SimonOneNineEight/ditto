'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
    type InterviewListItem,
    getInterviewTypeShortLabel,
} from '@/services/interview-service';

interface NeedsFeedbackSectionProps {
    interviews: InterviewListItem[];
}

type FeedbackStatus = 'awaiting' | 'overdue';

function getFeedbackStatus(scheduledDate: string, outcome?: string): FeedbackStatus | null {
    if (outcome) return null;

    const interviewDate = startOfDay(parseISO(scheduledDate));
    const today = startOfDay(new Date());

    if (interviewDate >= today) return null;

    const daysPast = differenceInDays(today, interviewDate);
    if (daysPast <= 2) return 'awaiting';
    return 'overdue';
}

function filterNeedsFeedback(interviews: InterviewListItem[]): InterviewListItem[] {
    return interviews.filter((interview) => {
        const status = getFeedbackStatus(interview.scheduled_date, interview.outcome);
        return status !== null;
    });
}

function StatusBadge({ status }: { status: FeedbackStatus }) {
    return (
        <Badge variant={status}>
            {status === 'awaiting' ? 'Awaiting' : 'Overdue'}
        </Badge>
    );
}

export function NeedsFeedbackSection({ interviews }: NeedsFeedbackSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const needsFeedbackInterviews = filterNeedsFeedback(interviews);

    if (needsFeedbackInterviews.length === 0) {
        return null;
    }

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="rounded-lg overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 p-4 bg-accent-muted rounded-t-lg"
            >
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold">Needs Feedback</span>
                <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded text-xs font-semibold">
                    {needsFeedbackInterviews.length}
                </span>
            </button>

            {isExpanded && (
                <div>
                    {needsFeedbackInterviews.map((interview, index) => {
                        const status = getFeedbackStatus(
                            interview.scheduled_date,
                            interview.outcome
                        )!;
                        const isLast = index === needsFeedbackInterviews.length - 1;

                        return (
                            <div
                                key={interview.id}
                                className={cn(
                                    'flex items-center justify-between p-4 bg-card gap-3',
                                    !isLast && 'border-b border-border',
                                    isLast && 'rounded-b-lg'
                                )}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="w-[100px] text-sm font-medium truncate">
                                        {interview.company_name}
                                    </span>
                                    <span className="flex-1 text-sm truncate">
                                        {interview.job_title}
                                    </span>
                                    <span className="w-[70px] text-[13px] text-muted-foreground">
                                        Round {interview.round_number}
                                    </span>
                                    <span className="w-[90px]">
                                        <Badge variant={interview.interview_type as 'phone_screen' | 'technical' | 'behavioral' | 'onsite' | 'panel' | 'other'}>
                                            {getInterviewTypeShortLabel(interview.interview_type)}
                                        </Badge>
                                    </span>
                                    <span className="w-[100px] text-[13px] text-muted-foreground">
                                        {formatDate(interview.scheduled_date)}
                                    </span>
                                    <span className="w-[90px]">
                                        <StatusBadge status={status} />
                                    </span>
                                </div>
                                <Link
                                    href={`/interviews/${interview.id}`}
                                    className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Feedback
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export { filterNeedsFeedback, getFeedbackStatus };
