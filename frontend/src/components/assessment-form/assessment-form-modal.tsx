'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { assessmentSchema, type AssessmentFormData } from '@/lib/schemas/assessment';
import { isValidationError, getFieldErrors } from '@/lib/errors';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

import {
    createAssessment,
    ASSESSMENT_TYPE_OPTIONS,
    type Assessment,
    type AssessmentType,
} from '@/services/assessment-service';

type FormData = AssessmentFormData;

interface AssessmentFormModalProps {
    applicationId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (assessment: Assessment) => void;
}

export const AssessmentFormModal = ({
    applicationId,
    open,
    onOpenChange,
    onSuccess,
}: AssessmentFormModalProps) => {
    const {
        control,
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting, isValid },
    } = useForm<FormData>({
        resolver: zodResolver(assessmentSchema),
        mode: 'onChange',
        defaultValues: {
            title: '',
            instructions: '',
            requirements: '',
        },
    });

    const onSubmit = async (data: FormData) => {
        try {
            const assessment = await createAssessment({
                application_id: applicationId,
                assessment_type: data.assessment_type as AssessmentType,
                title: data.title,
                due_date: format(data.due_date, 'yyyy-MM-dd'),
                instructions: data.instructions || undefined,
                requirements: data.requirements || undefined,
            });

            toast.success('Assessment created successfully');
            reset();
            onOpenChange(false);
            onSuccess?.(assessment);
        } catch (error) {
            if (isValidationError(error)) {
                const fieldErrors = getFieldErrors(error);
                if (fieldErrors) {
                    Object.entries(fieldErrors).forEach(([field, message]) => {
                        setError(field as keyof FormData, { message });
                    });
                }
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 sm:block">
                    <DialogHeader>
                        <DialogTitle>Add Assessment</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="assessment-type" className="text-xs font-medium text-muted-foreground">
                                Assessment Type <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="assessment_type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? ''}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger
                                            id="assessment-type"
                                            aria-required="true"
                                            aria-invalid={!!errors.assessment_type}
                                            aria-describedby={errors.assessment_type ? 'assessment-type-error' : undefined}
                                        >
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ASSESSMENT_TYPE_OPTIONS.map((type) => (
                                                <SelectItem
                                                    key={type.value}
                                                    value={type.value}
                                                >
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.assessment_type && (
                                <p id="assessment-type-error" className="text-sm text-destructive" role="alert">
                                    {errors.assessment_type.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="assessment-title" className="text-xs font-medium text-muted-foreground">
                                Title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="assessment-title"
                                {...register('title')}
                                placeholder="e.g., Backend API Challenge"
                                disabled={isSubmitting}
                                aria-required="true"
                                aria-invalid={!!errors.title}
                                aria-describedby={errors.title ? 'assessment-title-error' : undefined}
                            />
                            {errors.title && (
                                <p id="assessment-title-error" className="text-sm text-destructive" role="alert">
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="assessment-due-date" className="text-xs font-medium text-muted-foreground">
                                Due Date <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                name="due_date"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        id="assessment-due-date"
                                        value={field.value}
                                        onChange={field.onChange}
                                        className="w-full"
                                        aria-invalid={!!errors.due_date}
                                        aria-describedby={errors.due_date ? 'assessment-due-date-error' : undefined}
                                    />
                                )}
                            />
                            {errors.due_date && (
                                <p id="assessment-due-date-error" className="text-sm text-destructive" role="alert">
                                    {errors.due_date.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="assessment-instructions" className="text-xs font-medium text-muted-foreground">
                                Instructions (optional)
                            </Label>
                            <Textarea
                                id="assessment-instructions"
                                {...register('instructions')}
                                placeholder="Enter any instructions or requirements..."
                                rows={3}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="assessment-requirements" className="text-xs font-medium text-muted-foreground">
                                Requirements (optional)
                            </Label>
                            <Textarea
                                id="assessment-requirements"
                                {...register('requirements')}
                                placeholder="Technical requirements, constraints, etc..."
                                rows={3}
                                disabled={isSubmitting}
                            />
                        </div>
                    </DialogBody>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isValid}
                            aria-disabled={isSubmitting || !isValid}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Assessment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
