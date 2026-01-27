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
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { createInterview, Interview } from '@/services/interview-service';

const INTERVIEW_TYPES = [
    { value: 'phone_screen', label: 'Phone Screen' },
    { value: 'technical', label: 'Technical' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'panel', label: 'Panel' },
    { value: 'onsite', label: 'Onsite' },
    { value: 'other', label: 'Other' },
] as const;

const formSchema = z.object({
    interview_type: z.enum(
        ['phone_screen', 'technical', 'behavioral', 'panel', 'onsite', 'other'],
        {
            required_error: 'Please select an interview type',
        }
    ),
    scheduled_date: z.string().min(1, 'Date is required'),
    scheduled_time: z.string().optional(),
    duration_minutes: z
        .union([z.number().positive(), z.nan()])
        .optional()
        .transform((val) => (Number.isNaN(val) ? undefined : val)),
});

type FormData = z.infer<typeof formSchema>;

interface InterviewFormModalProps {
    applicationId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (interview: Interview) => void;
    currentInterviewCount?: number;
}

export const InterviewFormModal = ({
    applicationId,
    open,
    onOpenChange,
    onSuccess,
    currentInterviewCount = 0,
}: InterviewFormModalProps) => {
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isValid },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: {
            scheduled_date: format(new Date(), 'yyyy-MM-dd'),
            duration_minutes: 30,
        },
    });

    const nextRoundNumber = currentInterviewCount + 1;

    const onSubmit = async (data: FormData) => {
        try {
            const interview = await createInterview({
                application_id: applicationId,
                interview_type: data.interview_type,
                scheduled_date: data.scheduled_date,
                scheduled_time: data.scheduled_time || undefined,
                duration_minutes: data.duration_minutes || undefined,
            });

            toast.success('Interview created successfully');
            reset();
            onOpenChange(false);
            onSuccess?.(interview);
        } catch {
            toast.error('Failed to create interview');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Add Interview - Round {nextRoundNumber}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Interview Type *</Label>
                        <Controller
                            name="interview_type"
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
                                        {INTERVIEW_TYPES.map((type) => (
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
                        {errors.interview_type && (
                            <p className="text-sm text-destructive">
                                {errors.interview_type.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Scheduled Date *</Label>
                        <Input
                            type="date"
                            disabled={isSubmitting}
                            {...register('scheduled_date')}
                        />
                        {errors.scheduled_date && (
                            <p className="text-sm text-destructive">
                                {errors.scheduled_date.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Scheduled Time</Label>
                        <Input
                            type="time"
                            disabled={isSubmitting}
                            {...register('scheduled_time')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                            type="number"
                            placeholder="30"
                            disabled={isSubmitting}
                            {...register('duration_minutes', {
                                valueAsNumber: true,
                            })}
                        />
                    </div>

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
                            {isSubmitting ? 'Creating...' : 'Create Interview'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
