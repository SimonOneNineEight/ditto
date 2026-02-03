'use client';

import Link from 'next/link';
import { History, Check } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';

import { cn } from '@/lib/utils';
import { getInterviewTypeLabel, type RoundSummary } from '@/services/interview-service';

interface InterviewRoundsPanelProps {
    rounds: RoundSummary[];
    currentRoundId: string;
}

export function InterviewRoundsPanel({ rounds, currentRoundId }: InterviewRoundsPanelProps) {
    if (rounds.length <= 1) {
        return null;
    }

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'MMM d');
        } catch {
            return dateStr;
        }
    };

    const isCompleted = (dateStr: string) => {
        try {
            const scheduledDate = startOfDay(parseISO(dateStr));
            const today = startOfDay(new Date());
            return scheduledDate < today;
        } catch {
            return false;
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                <History className="h-4 w-4" />
                <span>Interview Rounds</span>
            </div>

            <div className="space-y-1">
                {rounds.map((round) => {
                    const isCurrent = round.id === currentRoundId;
                    const completed = isCompleted(round.scheduled_date);

                    if (isCurrent) {
                        return (
                            <div
                                key={round.id}
                                className="flex items-start gap-3 p-3 rounded-lg border-2 border-primary bg-primary/5"
                            >
                                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium">
                                        Round {round.round_number} - {getInterviewTypeLabel(round.interview_type)}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatDate(round.scheduled_date)} · Viewing
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={round.id}
                            href={`/interviews/${round.id}`}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                            {completed ? (
                                <div className="mt-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                            ) : (
                                <div className="mt-0.5 h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                                <div className={cn(
                                    "font-medium",
                                    !completed && "text-muted-foreground"
                                )}>
                                    Round {round.round_number} - {getInterviewTypeLabel(round.interview_type)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {formatDate(round.scheduled_date)}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
