'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
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

const interviewerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    role: z.string().optional(),
});

const formSchema = z.object({
    interviewers: z.array(interviewerSchema).min(1),
});

type FormData = z.infer<typeof formSchema>;

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
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
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
        } catch {
            toast.error('Failed to add interviewer(s)');
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
                                            Name *
                                        </Label>
                                        <Input
                                            id={`interviewers.${index}.name`}
                                            placeholder="e.g., John Smith"
                                            disabled={isSubmitting}
                                            {...register(`interviewers.${index}.name`)}
                                        />
                                        {errors.interviewers?.[index]?.name && (
                                            <p className="text-sm text-destructive">
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
                        <Button type="submit" disabled={isSubmitting}>
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
