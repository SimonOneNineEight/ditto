'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { questionFormSchema, type QuestionFormData } from '@/lib/schemas/question';
import { isValidationError, getFieldErrors } from '@/lib/errors';
import { Plus } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import {
    createQuestion,
    createQuestions,
    InterviewQuestion,
} from '@/services/interview-service';

type FormData = QuestionFormData;

interface AddQuestionFormProps {
    interviewId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (questions: InterviewQuestion[]) => void;
}

export const AddQuestionForm = ({
    interviewId,
    open,
    onOpenChange,
    onSuccess,
}: AddQuestionFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isValid },
    } = useForm<FormData>({
        resolver: zodResolver(questionFormSchema),
        mode: 'onChange',
        defaultValues: {
            questions: [{ question_text: '', answer_text: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'questions',
    });

    const handleClose = () => {
        reset({ questions: [{ question_text: '', answer_text: '' }] });
        onOpenChange(false);
    };

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const validQuestions = data.questions.filter(
                (q) => q.question_text.trim() !== ''
            );

            if (validQuestions.length === 0) {
                toast.error('Please add at least one question');
                return;
            }

            let created: InterviewQuestion[];

            if (validQuestions.length === 1) {
                const question = await createQuestion(interviewId, {
                    question_text: validQuestions[0].question_text,
                    answer_text: validQuestions[0].answer_text || undefined,
                });
                created = [question];
            } else {
                created = await createQuestions(
                    interviewId,
                    validQuestions.map((q) => ({
                        question_text: q.question_text,
                        answer_text: q.answer_text || undefined,
                    }))
                );
            }

            const count = created.length;
            toast.success(
                count === 1
                    ? 'Question added successfully'
                    : `${count} questions added successfully`
            );

            reset({ questions: [{ question_text: '', answer_text: '' }] });
            onOpenChange(false);
            onSuccess?.(created);
        } catch (error) {
            if (isValidationError(error)) {
                const fieldErrors = getFieldErrors(error);
                if (fieldErrors) {
                    const fieldMap: Record<string, 'questions.0.question_text' | 'questions.0.answer_text'> = {
                        question_text: 'questions.0.question_text',
                        answer_text: 'questions.0.answer_text',
                    };
                    Object.entries(fieldErrors).forEach(([field, message]) => {
                        const formField = fieldMap[field];
                        if (formField) setError(formField, { message });
                    });
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const addAnother = () => {
        append({ question_text: '', answer_text: '' });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Question</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogBody className="space-y-4">
                        <div className="space-y-6 max-h-[500px] overflow-y-auto">
                            {fields.map((field, index) => (
                                <div key={field.id} className="space-y-3">
                                    {fields.length > 1 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Question {index + 1}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                                onClick={() => remove(index)}
                                                disabled={isSubmitting}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor={`questions.${index}.question_text`}
                                            className="text-sm text-muted-foreground"
                                        >
                                            Question <span className="text-destructive">*</span>
                                        </Label>
                                        <Textarea
                                            id={`questions.${index}.question_text`}
                                            placeholder="What question were you asked?"
                                            disabled={isSubmitting}
                                            className="min-h-[80px] resize-none"
                                            aria-required="true"
                                            aria-invalid={!!errors.questions?.[index]?.question_text}
                                            aria-describedby={errors.questions?.[index]?.question_text ? `questions-${index}-text-error` : undefined}
                                            {...register(
                                                `questions.${index}.question_text`
                                            )}
                                        />
                                        {errors.questions?.[index]?.question_text && (
                                            <p id={`questions-${index}-text-error`} role="alert" className="text-sm text-destructive">
                                                {
                                                    errors.questions[index]
                                                        ?.question_text?.message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor={`questions.${index}.answer_text`}
                                            className="text-sm text-muted-foreground"
                                        >
                                            Your Answer
                                        </Label>
                                        <Textarea
                                            id={`questions.${index}.answer_text`}
                                            placeholder="How did you answer? (optional)"
                                            disabled={isSubmitting}
                                            className="min-h-[100px] resize-none"
                                            {...register(
                                                `questions.${index}.answer_text`
                                            )}
                                        />
                                    </div>

                                    {fields.length > 1 &&
                                        index < fields.length - 1 && (
                                            <div className="border-b border-border/50 pt-3" />
                                        )}
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addAnother}
                            disabled={isSubmitting}
                            className="w-full text-muted-foreground hover:text-foreground"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Question
                        </Button>
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !isValid} aria-disabled={isSubmitting || !isValid}>
                            {isSubmitting
                                ? 'Saving...'
                                : fields.length > 1
                                  ? 'Save All'
                                  : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
