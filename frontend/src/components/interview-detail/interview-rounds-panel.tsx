'use client';

import { useState } from 'react';
import Link from 'next/link';
import { History, Check } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    getInterviewTypeLabel,
    type RoundSummary,
} from '@/services/interview-service';
import { AddRoundDialog } from './add-round-dialog';

interface InterviewRoundsPanelProps {
    rounds: RoundSummary[];
    currentRoundId: string;
    applicationId: string;
    onUpdate?: () => void;
}

export function InterviewRoundsPanel({ rounds, currentRoundId, applicationId }: InterviewRoundsPanelProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);

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
        <>
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <History className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                        Interview Rounds
                    </span>
                </div>
                <Button variant="ghost-primary" size="sm" onClick={() => setIsAddOpen(true)}>
                    + Add Round
                </Button>
            </div>

            <div className="space-y-1">
                {rounds.map((round) => {
                    const isCurrent = round.id === currentRoundId;
                    const completed = isCompleted(round.scheduled_date);

                    if (isCurrent) {
                        return (
                            <div
                                key={round.id}
                                className="flex items-start gap-3 px-3 py-2 rounded-md border border-primary bg-primary/5"
                            >
                                <div className="mt-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium">
                                        Round {round.round_number} - {getInterviewTypeLabel(round.interview_type)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
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
                            className="flex items-start gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                            {completed ? (
                                <div className="mt-0.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                </div>
                            ) : (
                                <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-border flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                                <div className={cn(
                                    "text-sm",
                                    completed ? "text-muted-foreground" : "text-muted-foreground"
                                )}>
                                    Round {round.round_number} - {getInterviewTypeLabel(round.interview_type)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {formatDate(round.scheduled_date)}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>

        <AddRoundDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            applicationId={applicationId}
        />
        </>
    );
}
