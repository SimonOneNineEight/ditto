'use client';

import { User } from 'lucide-react';

import { CollapsibleSection } from './collapsible-section';
import { Interviewer } from '@/services/interview-service';

interface InterviewersSectionProps {
    interviewers: Interviewer[];
    interviewId: string;
    onUpdate: () => void;
}

export const InterviewersSection = ({
    interviewers,
    onUpdate,
}: InterviewersSectionProps) => {
    const isEmpty = interviewers.length === 0;

    const handleAddInterviewer = () => {
        // TODO: Implement add interviewer modal (Story 2.5)
        console.log('Add interviewer - to be implemented in Story 2.5');
    };

    return (
        <CollapsibleSection
            title="Interviewers"
            isEmpty={isEmpty}
            emptyState={{
                message: 'No interviewers added yet',
                actionLabel: 'Add Interviewer',
                onAction: handleAddInterviewer,
            }}
        >
            <div className="space-y-3">
                {interviewers.map((interviewer) => (
                    <div
                        key={interviewer.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{interviewer.name}</p>
                            {interviewer.role && (
                                <p className="text-sm text-muted-foreground">
                                    {interviewer.role}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </CollapsibleSection>
    );
};
