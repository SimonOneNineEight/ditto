'use client';

import { useState, useEffect } from 'react';
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

const STORAGE_KEY = 'ditto-needs-feedback-expanded';
const MOBILE_BREAKPOINT = 640;

function getInitialExpandedState(): boolean {
    if (typeof window === 'undefined') return true;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
        return stored === 'true';
    }

    return window.innerWidth >= MOBILE_BREAKPOINT;
}

export function NeedsFeedbackSection({ interviews }: NeedsFeedbackSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        setIsExpanded(getInitialExpandedState());
        setIsInitialized(true);
    }, []);

    const handleToggle = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem(STORAGE_KEY, String(newState));
    };

    const needsFeedbackInterviews = filterNeedsFeedback(interviews);

    if (needsFeedbackInterviews.length === 0 || !isInitialized) {
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
                onClick={handleToggle}
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
                            <Link
                                key={interview.id}
                                href={`/interviews/${interview.id}`}
                                className={cn(
                                    'block p-4 bg-card hover:bg-accent/50 transition-colors',
                                    !isLast && 'border-b border-border',
                                    isLast && 'rounded-b-lg'
                                )}
                            >
                                {/* Mobile Layout */}
                                <div className="sm:hidden space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium truncate">
                                            {interview.company_name}
                                        </span>
                                        <StatusBadge status={status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {interview.job_title}
                                    </p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                        <span>Round {interview.round_number}</span>
                                        <span>·</span>
                                        <Badge
                                            variant={interview.interview_type as 'phone_screen' | 'technical' | 'behavioral' | 'onsite' | 'panel' | 'other'}
                                            className="text-[10px] px-1.5 py-0"
                                        >
                                            {getInterviewTypeShortLabel(interview.interview_type)}
                                        </Badge>
                                        <span>·</span>
                                        <span>{formatDate(interview.scheduled_date)}</span>
                                    </div>
                                </div>

                                {/* Tablet/Desktop Layout */}
                                <div className="hidden sm:flex items-center justify-between gap-3">
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
                                    <div className="flex items-center gap-1 text-[13px] font-medium text-primary">
                                        <Plus className="h-3.5 w-3.5" />
                                        Feedback
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export { filterNeedsFeedback, getFeedbackStatus };
