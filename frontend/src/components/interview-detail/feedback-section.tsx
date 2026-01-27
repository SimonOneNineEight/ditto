'use client';

import { FileText, MessageSquare, Lightbulb, BookOpen, StickyNote } from 'lucide-react';

import { CollapsibleSection } from './collapsible-section';
import { InterviewNote } from '@/services/interview-service';
import { Badge } from '@/components/ui/badge';

interface FeedbackSectionProps {
    notes: InterviewNote[];
    interviewId: string;
    onUpdate: () => void;
}

const NOTE_TYPE_CONFIG: Record<
    string,
    { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }
> = {
    preparation: {
        label: 'Preparation',
        icon: <BookOpen className="h-3 w-3" />,
        variant: 'secondary',
    },
    company_research: {
        label: 'Company Research',
        icon: <Lightbulb className="h-3 w-3" />,
        variant: 'secondary',
    },
    feedback: {
        label: 'Feedback',
        icon: <MessageSquare className="h-3 w-3" />,
        variant: 'default',
    },
    reflection: {
        label: 'Reflection',
        icon: <FileText className="h-3 w-3" />,
        variant: 'outline',
    },
    general: {
        label: 'General',
        icon: <StickyNote className="h-3 w-3" />,
        variant: 'outline',
    },
};

export const FeedbackSection = ({
    notes,
    onUpdate,
}: FeedbackSectionProps) => {
    const isEmpty = notes.length === 0;

    const handleAddNote = () => {
        // TODO: Implement add note modal (Story 2.7)
        console.log('Add note - to be implemented in Story 2.7');
    };

    const getNoteConfig = (noteType: string) => {
        return NOTE_TYPE_CONFIG[noteType] || NOTE_TYPE_CONFIG.general;
    };

    return (
        <CollapsibleSection
            title="Notes & Feedback"
            isEmpty={isEmpty}
            emptyState={{
                message: 'No notes or feedback recorded yet',
                actionLabel: 'Add Note',
                onAction: handleAddNote,
            }}
        >
            <div className="space-y-4">
                {notes.map((note) => {
                    const config = getNoteConfig(note.note_type);
                    return (
                        <div
                            key={note.id}
                            className="p-4 rounded-lg border bg-card"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={config.variant} className="gap-1">
                                    {config.icon}
                                    {config.label}
                                </Badge>
                            </div>
                            {note.content ? (
                                <div
                                    className="prose prose-sm max-w-none text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                />
                            ) : (
                                <p className="text-muted-foreground italic">No content</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </CollapsibleSection>
    );
};
