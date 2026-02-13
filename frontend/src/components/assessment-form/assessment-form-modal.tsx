'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';

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

const formSchema = z.object({
    assessment_type: z.enum(
        [
            'take_home_project',
            'live_coding',
            'system_design',
            'data_structures',
            'case_study',
            'other',
        ],
        {
            required_error: 'Please select an assessment type',
        }
    ),
    title: z
        .string()
        .min(1, 'Title is required')
        .max(255, 'Title must be 255 characters or less'),
    due_date: z.date({ required_error: 'Due date is required' }),
    instructions: z.string().optional(),
    requirements: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

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
        formState: { errors, isSubmitting, isValid },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
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
        } catch {
            toast.error('Failed to create assessment');
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
                            <Label className="text-xs font-medium text-muted-foreground">
                                Assessment Type
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
                                        <SelectTrigger>
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
                                <p className="text-sm text-destructive">
                                    {errors.assessment_type.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Title
                            </Label>
                            <Input
                                {...register('title')}
                                placeholder="e.g., Backend API Challenge"
                                disabled={isSubmitting}
                            />
                            {errors.title && (
                                <p className="text-sm text-destructive">
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Due Date
                            </Label>
                            <Controller
                                name="due_date"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        className="w-full"
                                    />
                                )}
                            />
                            {errors.due_date && (
                                <p className="text-sm text-destructive">
                                    {errors.due_date.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Instructions (optional)
                            </Label>
                            <Textarea
                                {...register('instructions')}
                                placeholder="Enter any instructions or requirements..."
                                rows={3}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                                Requirements (optional)
                            </Label>
                            <Textarea
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
                        >
                            {isSubmitting ? 'Creating...' : 'Create Assessment'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
