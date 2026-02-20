'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Pencil,
    Trash2,
    Check,
    X,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { InterviewDetailCard } from './interview-detail-card';
import { AutoSaveIndicator } from '@/components/auto-save-indicator';
import { AddQuestionForm } from './add-question-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';

import type { AutoSaveStatus } from '@/hooks/useAutoSave';
import {
    InterviewQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
} from '@/services/interview-service';

interface QuestionsCardProps {
    questions: InterviewQuestion[];
    interviewId: string;
    onUpdate: () => void;
}

interface EditingState {
    id: string;
    question_text: string;
    answer_text: string;
}

export const QuestionsCard = ({
    questions,
    interviewId,
    onUpdate,
}: QuestionsCardProps) => {
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [editing, setEditing] = useState<EditingState | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<InterviewQuestion | null>(
        null
    );
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedRef = useRef<{
        question_text: string;
        answer_text: string;
    } | null>(null);

    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

    const performAutoSave = useCallback(async () => {
        if (!editing) return;

        if (
            lastSavedRef.current &&
            lastSavedRef.current.question_text === editing.question_text &&
            lastSavedRef.current.answer_text === editing.answer_text
        ) {
            return;
        }

        if (!editing.question_text.trim()) {
            return;
        }

        setAutoSaveStatus('saving');
        try {
            await updateQuestion(editing.id, {
                question_text: editing.question_text.trim(),
                answer_text: editing.answer_text.trim() || undefined,
            });
            lastSavedRef.current = {
                question_text: editing.question_text,
                answer_text: editing.answer_text,
            };
            setAutoSaveStatus('saved');
            onUpdate();
        } catch {
            setAutoSaveStatus('error');
        }
    }, [editing, onUpdate]);

    useEffect(() => {
        if (!editing) {
            setAutoSaveStatus('idle');
            return;
        }

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            performAutoSave();
        }, 30000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [editing?.question_text, editing?.answer_text, performAutoSave]);

    const handleAddQuestion = () => {
        setIsAddFormOpen(true);
    };

    const handleAddSuccess = () => {
        onUpdate();
    };

    const startEditing = (question: InterviewQuestion) => {
        setEditing({
            id: question.id,
            question_text: question.question_text,
            answer_text: question.answer_text || '',
        });
        lastSavedRef.current = {
            question_text: question.question_text,
            answer_text: question.answer_text || '',
        };
        setAutoSaveStatus('idle');
    };

    const cancelEditing = () => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }
        setEditing(null);
        setAutoSaveStatus('idle');
        lastSavedRef.current = null;
    };

    const saveEditing = async () => {
        if (!editing) return;

        if (!editing.question_text.trim()) {
            toast.error('Question is required');
            return;
        }

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        setIsSaving(true);
        try {
            await updateQuestion(editing.id, {
                question_text: editing.question_text.trim(),
                answer_text: editing.answer_text.trim() || undefined,
            });
            toast.success('Question updated successfully');
            setEditing(null);
            setAutoSaveStatus('idle');
            lastSavedRef.current = null;
            onUpdate();
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            await deleteQuestion(deleteTarget.id);
            toast.success('Question deleted successfully');
            setDeleteTarget(null);
            onUpdate();
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsDeleting(false);
        }
    };

    const handleMoveUp = async (
        question: InterviewQuestion,
        currentIndex: number
    ) => {
        if (currentIndex === 0) return;

        setIsReordering(true);
        try {
            const newOrder = [...sortedQuestions];
            [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
                newOrder[currentIndex],
                newOrder[currentIndex - 1],
            ];
            await reorderQuestions(
                interviewId,
                newOrder.map((q) => q.id)
            );
            onUpdate();
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsReordering(false);
        }
    };

    const handleMoveDown = async (
        question: InterviewQuestion,
        currentIndex: number
    ) => {
        if (currentIndex === sortedQuestions.length - 1) return;

        setIsReordering(true);
        try {
            const newOrder = [...sortedQuestions];
            [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
                newOrder[currentIndex + 1],
                newOrder[currentIndex],
            ];
            await reorderQuestions(
                interviewId,
                newOrder.map((q) => q.id)
            );
            onUpdate();
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsReordering(false);
        }
    };

    const headerAction = (
        <Button variant="ghost-primary" size="sm" onClick={handleAddQuestion}>
            + Add Question
        </Button>
    );

    return (
        <>
            <InterviewDetailCard
                title="Questions & Answers"
                headerAction={headerAction}
            >
                {sortedQuestions.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
                        No questions recorded yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedQuestions.map((question, index) => (
                            <div
                                key={question.id}
                                className="p-4 rounded-lg bg-muted group"
                            >
                                {editing?.id === question.id ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-muted-foreground">
                                                Question {index + 1}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <AutoSaveIndicator
                                                    status={autoSaveStatus}
                                                    onRetry={performAutoSave}
                                                />
                                            </div>
                                        </div>
                                        <Textarea
                                            value={editing.question_text}
                                            onChange={(e) =>
                                                setEditing({
                                                    ...editing,
                                                    question_text:
                                                        e.target.value,
                                                })
                                            }
                                            placeholder="What question were you asked?"
                                            className="min-h-[80px] resize-none"
                                            disabled={isSaving}
                                            autoFocus
                                        />
                                        <div className="pt-2 border-t border-border">
                                            <div className="text-xs text-muted-foreground mb-2">
                                                My Answer
                                            </div>
                                            <Textarea
                                                value={editing.answer_text}
                                                onChange={(e) =>
                                                    setEditing({
                                                        ...editing,
                                                        answer_text:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="How did you answer? (optional)"
                                                className="min-h-[100px] resize-none"
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={cancelEditing}
                                                disabled={isSaving}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={saveEditing}
                                                disabled={isSaving}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-muted-foreground mb-1">
                                                    Question {index + 1}
                                                </div>
                                                <p className="text-sm font-medium whitespace-pre-wrap">
                                                    {question.question_text}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                {sortedQuestions.length > 1 && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`Move question ${index + 1} up`}
                                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                            onClick={() =>
                                                                handleMoveUp(
                                                                    question,
                                                                    index
                                                                )
                                                            }
                                                            disabled={
                                                                index === 0 ||
                                                                isReordering
                                                            }
                                                        >
                                                            <ChevronUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`Move question ${index + 1} down`}
                                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                            onClick={() =>
                                                                handleMoveDown(
                                                                    question,
                                                                    index
                                                                )
                                                            }
                                                            disabled={
                                                                index ===
                                                                    sortedQuestions.length -
                                                                        1 ||
                                                                isReordering
                                                            }
                                                        >
                                                            <ChevronDown className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Edit question ${index + 1}`}
                                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        startEditing(question)
                                                    }
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={`Delete question ${index + 1}`}
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        setDeleteTarget(question)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        {question.answer_text && (
                                            <div className="pt-2 border-t border-border/50">
                                                <div className="text-xs text-muted-foreground mb-1">
                                                    My Answer
                                                </div>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {question.answer_text}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </InterviewDetailCard>

            <AddQuestionForm
                interviewId={interviewId}
                open={isAddFormOpen}
                onOpenChange={setIsAddFormOpen}
                onSuccess={handleAddSuccess}
            />

            <DeleteConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Question"
                description="Are you sure you want to delete this question? This action cannot be undone."
                isDeleting={isDeleting}
                destructive
            />
        </>
    );
};
