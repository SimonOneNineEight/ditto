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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

import { createInterview, Interview } from '@/services/interview-service';

const INTERVIEW_TYPES = [
    { value: 'phone_screen', label: 'Phone Screen' },
    { value: 'technical', label: 'Technical' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'panel', label: 'Panel' },
    { value: 'onsite', label: 'Onsite' },
    { value: 'other', label: 'Other' },
] as const;

const DURATION_OPTIONS = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
    { value: '90', label: '90 minutes' },
    { value: '120', label: '120 minutes' },
];

const formSchema = z.object({
    interview_type: z.enum(
        ['phone_screen', 'technical', 'behavioral', 'panel', 'onsite', 'other'],
        {
            required_error: 'Please select an interview type',
        }
    ),
    scheduled_date: z.date({ required_error: 'Date is required' }),
    scheduled_time: z.string().optional(),
    duration_minutes: z.string().optional(),
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
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isValid },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: {
            scheduled_date: new Date(),
            duration_minutes: '60',
        },
    });

    const nextRoundNumber = currentInterviewCount + 1;

    const onSubmit = async (data: FormData) => {
        try {
            const interview = await createInterview({
                application_id: applicationId,
                interview_type: data.interview_type,
                scheduled_date: format(data.scheduled_date, 'yyyy-MM-dd'),
                scheduled_time: data.scheduled_time || undefined,
                duration_minutes: data.duration_minutes
                    ? parseInt(data.duration_minutes, 10)
                    : undefined,
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
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 sm:block">
                    <DialogHeader>
                        <DialogTitle>Add Interview</DialogTitle>
                    </DialogHeader>
                    <DialogBody className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Round (auto)</Label>
                            <div className="flex items-center rounded-md bg-muted px-3.5 py-3 text-sm font-medium text-muted-foreground">
                                Round {nextRoundNumber}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Interview Type</Label>
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

                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Date</Label>
                                <Controller
                                    name="scheduled_date"
                                    control={control}
                                    render={({ field }) => (
                                        <DatePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            className="w-full"
                                        />
                                    )}
                                />
                                {errors.scheduled_date && (
                                    <p className="text-sm text-destructive">
                                        {errors.scheduled_date.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">Time</Label>
                                <Controller
                                    name="scheduled_time"
                                    control={control}
                                    render={({ field }) => (
                                        <TimePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isSubmitting}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Duration</Label>
                            <Controller
                                name="duration_minutes"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? ''}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select duration" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DURATION_OPTIONS.map((opt) => (
                                                <SelectItem
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
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
                            {isSubmitting ? 'Adding...' : 'Add Interview'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
