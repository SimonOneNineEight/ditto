'use client';

import { HelpCircle } from 'lucide-react';

import { CollapsibleSection } from './collapsible-section';
import { InterviewQuestion } from '@/services/interview-service';

interface QuestionsSectionProps {
    questions: InterviewQuestion[];
    interviewId: string;
    onUpdate: () => void;
}

export const QuestionsSection = ({
    questions,
    onUpdate,
}: QuestionsSectionProps) => {
    const isEmpty = questions.length === 0;

    const handleAddQuestion = () => {
        // TODO: Implement add question modal (Story 2.6)
        console.log('Add question - to be implemented in Story 2.6');
    };

    // Sort questions by order
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

    return (
        <CollapsibleSection
            title="Questions & Answers"
            isEmpty={isEmpty}
            emptyState={{
                message: 'No questions recorded yet',
                actionLabel: 'Add Question',
                onAction: handleAddQuestion,
            }}
        >
            <div className="space-y-4">
                {sortedQuestions.map((question, index) => (
                    <div
                        key={question.id}
                        className="p-4 rounded-lg border bg-card"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-medium text-primary">
                                {index + 1}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                        <HelpCircle className="h-3 w-3" />
                                        Question
                                    </div>
                                    <p className="font-medium">{question.question_text}</p>
                                </div>
                                {question.answer_text && (
                                    <div className="pt-2 border-t">
                                        <div className="text-sm text-muted-foreground mb-1">
                                            My Answer
                                        </div>
                                        <p className="text-muted-foreground">
                                            {question.answer_text}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </CollapsibleSection>
    );
};
