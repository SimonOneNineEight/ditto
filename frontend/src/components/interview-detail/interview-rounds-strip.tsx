'use client';

import { useState } from 'react';
import Link from 'next/link';
import { History, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
    getInterviewTypeShortLabel,
    type RoundSummary,
} from '@/services/interview-service';
import { AddRoundDialog } from './add-round-dialog';

interface InterviewRoundsStripProps {
    rounds: RoundSummary[];
    currentRoundId: string;
    applicationId: string;
    variant?: 'tablet' | 'mobile';
}

export function InterviewRoundsStrip({
    rounds,
    currentRoundId,
    applicationId,
    variant = 'tablet'
}: InterviewRoundsStripProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);

    const isMobile = variant === 'mobile';

    return (
        <>
        <div className={cn(
            "flex items-center gap-2 flex-wrap",
            isMobile ? "gap-1.5" : "gap-2"
        )}>
            {!isMobile && (
                <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
                    <History className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Rounds:</span>
                </div>
            )}

            {rounds.map((round) => {
                const isCurrent = round.id === currentRoundId;
                const label = isMobile
                    ? `R${round.round_number}`
                    : `Round ${round.round_number} - ${getInterviewTypeShortLabel(round.interview_type)}`;

                if (isCurrent) {
                    return (
                        <div
                            key={round.id}
                            className={cn(
                                "rounded-md border border-primary bg-primary/10",
                                isMobile ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]"
                            )}
                        >
                            <span className="text-primary font-semibold">{label}</span>
                        </div>
                    );
                }

                return (
                    <Link
                        key={round.id}
                        href={`/interviews/${round.id}`}
                        className={cn(
                            "rounded-md border border-border bg-transparent hover:bg-muted/50 transition-colors",
                            isMobile ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]"
                        )}
                    >
                        <span className="text-muted-foreground font-medium">{label}</span>
                    </Link>
                );
            })}

            <button
                onClick={() => setIsAddOpen(true)}
                className={cn(
                    "flex items-center gap-1 rounded-md border border-primary hover:bg-primary/10 transition-colors",
                    isMobile ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]"
                )}
            >
                <Plus className={cn(isMobile ? "h-2.5 w-2.5" : "h-3 w-3", "text-primary")} />
                <span className="text-primary font-medium">Add</span>
            </button>
        </div>

        <AddRoundDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            applicationId={applicationId}
        />
        </>
    );
}
