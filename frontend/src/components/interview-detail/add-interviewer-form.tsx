'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { interviewerFormSchema, type InterviewerFormData } from '@/lib/schemas/interviewer';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
    createInterviewer,
    createInterviewers,
    Interviewer,
} from '@/services/interview-service';

type FormData = InterviewerFormData;

interface AddInterviewerFormProps {
    interviewId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (interviewers: Interviewer[]) => void;
}

export const AddInterviewerForm = ({
    interviewId,
    open,
    onOpenChange,
    onSuccess,
}: AddInterviewerFormProps) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isValid },
    } = useForm<FormData>({
        resolver: zodResolver(interviewerFormSchema),
        mode: 'onChange',
        defaultValues: {
            interviewers: [{ name: '', role: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'interviewers',
    });

    const handleClose = () => {
        reset({ interviewers: [{ name: '', role: '' }] });
        onOpenChange(false);
    };

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const validInterviewers = data.interviewers.filter(
                (i) => i.name.trim() !== ''
            );

            if (validInterviewers.length === 0) {
                toast.error('Please add at least one interviewer with a name');
                return;
            }

            let created: Interviewer[];

            if (validInterviewers.length === 1) {
                const interviewer = await createInterviewer(interviewId, {
                    name: validInterviewers[0].name,
                    role: validInterviewers[0].role || undefined,
                });
                created = [interviewer];
            } else {
                created = await createInterviewers(
                    interviewId,
                    validInterviewers.map((i) => ({
                        name: i.name,
                        role: i.role || undefined,
                    }))
                );
            }

            const count = created.length;
            toast.success(
                count === 1
                    ? 'Interviewer added successfully'
                    : `${count} interviewers added successfully`
            );

            reset({ interviewers: [{ name: '', role: '' }] });
            onOpenChange(false);
            onSuccess?.(created);
        } catch (error) {
            if (isValidationError(error)) {
                const fieldErrors = getFieldErrors(error);
                if (fieldErrors) {
                    const fieldMap: Record<string, 'interviewers.0.name' | 'interviewers.0.role'> = {
                        name: 'interviewers.0.name',
                        role: 'interviewers.0.role',
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
        append({ name: '', role: '' });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Interviewer</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogBody className="space-y-4">
                        <div className="space-y-6 max-h-[400px] overflow-y-auto">
                            {fields.map((field, index) => (
                                <div
                                    key={field.id}
                                    className="space-y-3"
                                >
                                    {fields.length > 1 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Interviewer {index + 1}
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
                                            htmlFor={`interviewers.${index}.name`}
                                            className="text-sm text-muted-foreground"
                                        >
                                            Name <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id={`interviewers.${index}.name`}
                                            placeholder="e.g., John Smith"
                                            disabled={isSubmitting}
                                            aria-required="true"
                                            aria-invalid={!!errors.interviewers?.[index]?.name}
                                            aria-describedby={errors.interviewers?.[index]?.name ? `interviewers-${index}-name-error` : undefined}
                                            {...register(`interviewers.${index}.name`)}
                                        />
                                        {errors.interviewers?.[index]?.name && (
                                            <p id={`interviewers-${index}-name-error`} role="alert" className="text-sm text-destructive">
                                                {errors.interviewers[index]?.name?.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor={`interviewers.${index}.role`}
                                            className="text-sm text-muted-foreground"
                                        >
                                            Role
                                        </Label>
                                        <Input
                                            id={`interviewers.${index}.role`}
                                            placeholder="e.g., Engineering Manager"
                                            disabled={isSubmitting}
                                            {...register(`interviewers.${index}.role`)}
                                        />
                                    </div>

                                    {fields.length > 1 && index < fields.length - 1 && (
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
                            Add Another
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
