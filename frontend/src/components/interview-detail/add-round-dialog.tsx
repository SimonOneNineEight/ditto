'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    createInterview,
    INTERVIEW_TYPES,
} from '@/services/interview-service';

const DURATION_OPTIONS = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
    { value: '90', label: '90 minutes' },
    { value: '120', label: '120 minutes' },
];

const addRoundSchema = z.object({
    interview_type: z.enum([
        'phone_screen',
        'technical',
        'behavioral',
        'panel',
        'onsite',
        'other',
    ]),
    scheduled_date: z.date({ required_error: 'Date is required' }),
    scheduled_time: z.string().optional(),
    duration_minutes: z.string().optional(),
});

type AddRoundFormData = z.infer<typeof addRoundSchema>;

interface AddRoundDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    applicationId: string;
}

export function AddRoundDialog({ open, onOpenChange, applicationId }: AddRoundDialogProps) {
    const router = useRouter();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isValid },
    } = useForm<AddRoundFormData>({
        resolver: zodResolver(addRoundSchema),
        mode: 'onChange',
        defaultValues: {
            interview_type: 'technical',
        },
    });

    const onSubmit = async (formData: AddRoundFormData) => {
        try {
            const newInterview = await createInterview({
                application_id: applicationId,
                interview_type: formData.interview_type,
                scheduled_date: format(formData.scheduled_date, 'yyyy-MM-dd'),
                scheduled_time: formData.scheduled_time || undefined,
                duration_minutes: formData.duration_minutes
                    ? parseInt(formData.duration_minutes)
                    : undefined,
            });
            toast.success('Interview round added');
            onOpenChange(false);
            reset();
            router.push(`/interviews/${newInterview.id}`);
        } catch {
            toast.error('Failed to add interview round');
        }
    };

    const handleOpenChange = (value: boolean) => {
        if (value) {
            reset({
                interview_type: 'technical',
                scheduled_date: undefined,
                scheduled_time: '',
                duration_minutes: undefined,
            });
        }
        onOpenChange(value);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Interview Round</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogBody className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="round-type">Interview Type</Label>
                            <Controller
                                name="interview_type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger
                                            id="round-type"
                                            aria-required="true"
                                            aria-invalid={!!errors.interview_type}
                                            aria-describedby={errors.interview_type ? 'round-type-error' : undefined}
                                        >
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
                                <p id="round-type-error" className="text-sm text-destructive" role="alert">
                                    {errors.interview_type.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="round-date">Scheduled Date</Label>
                            <Controller
                                name="scheduled_date"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        id="round-date"
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={isSubmitting}
                                        aria-invalid={!!errors.scheduled_date}
                                        aria-describedby={errors.scheduled_date ? 'round-date-error' : undefined}
                                    />
                                )}
                            />
                            {errors.scheduled_date && (
                                <p id="round-date-error" role="alert" className="text-sm text-destructive">
                                    {errors.scheduled_date.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="round-time">Scheduled Time</Label>
                            <Controller
                                name="scheduled_time"
                                control={control}
                                render={({ field }) => (
                                    <TimePicker
                                        id="round-time"
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        disabled={isSubmitting}
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="round-duration">Duration</Label>
                            <Controller
                                name="duration_minutes"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger id="round-duration">
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
                            {isSubmitting ? 'Adding...' : 'Add Round'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
