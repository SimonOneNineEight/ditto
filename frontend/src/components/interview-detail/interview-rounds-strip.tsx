'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { History, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
    getInterviewTypeShortLabel,
    INTERVIEW_TYPES,
    type RoundSummary,
} from '@/services/interview-service';

const addRoundSchema = z.object({
    interview_type: z.enum([
        'phone_screen',
        'technical',
        'behavioral',
        'panel',
        'onsite',
        'other',
    ]),
    scheduled_date: z.string().min(1, 'Date is required'),
    scheduled_time: z.string().optional(),
    duration_minutes: z
        .union([z.number().positive(), z.nan()])
        .optional()
        .transform((val) => (Number.isNaN(val) ? undefined : val)),
});

type AddRoundFormData = z.infer<typeof addRoundSchema>;

interface InterviewRoundsStripProps {
    rounds: RoundSummary[];
    currentRoundId: string;
    applicationId: string;
    variant?: 'tablet' | 'mobile';
}

export function InterviewRoundsStrip({
    rounds,
    currentRoundId,
    applicationId,
    variant = 'tablet'
}: InterviewRoundsStripProps) {
    const router = useRouter();
    const [isAddOpen, setIsAddOpen] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isValid },
    } = useForm<AddRoundFormData>({
        resolver: zodResolver(addRoundSchema),
        mode: 'onChange',
        defaultValues: {
            interview_type: 'technical',
            scheduled_date: '',
        },
    });

    const onSubmit = async (formData: AddRoundFormData) => {
        try {
            const newInterview = await createInterview({
                application_id: applicationId,
                interview_type: formData.interview_type,
                scheduled_date: formData.scheduled_date,
                scheduled_time: formData.scheduled_time || undefined,
                duration_minutes: formData.duration_minutes,
            });
            toast.success('Interview round added');
            setIsAddOpen(false);
            reset();
            router.push(`/interviews/${newInterview.id}`);
        } catch (err) {
            console.error('Failed to add interview round:', err);
            toast.error('Failed to add interview round');
        }
    };

    const handleAddOpen = () => {
        reset({
            interview_type: 'technical',
            scheduled_date: '',
            scheduled_time: '',
            duration_minutes: undefined,
        });
        setIsAddOpen(true);
    };

    const isMobile = variant === 'mobile';

    return (
        <>
        <div className={cn(
            "flex items-center gap-2 flex-wrap",
            isMobile ? "gap-1.5" : "gap-2"
        )}>
            {!isMobile && (
                <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
                    <History className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Rounds:</span>
                </div>
            )}

            {rounds.map((round) => {
                const isCurrent = round.id === currentRoundId;
                const label = isMobile
                    ? `R${round.round_number}`
                    : `Round ${round.round_number} - ${getInterviewTypeShortLabel(round.interview_type)}`;

                if (isCurrent) {
                    return (
                        <div
                            key={round.id}
                            className={cn(
                                "rounded-md border border-primary bg-primary/10",
                                isMobile ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]"
                            )}
                        >
                            <span className="text-primary font-semibold">{label}</span>
                        </div>
                    );
                }

                return (
                    <Link
                        key={round.id}
                        href={`/interviews/${round.id}`}
                        className={cn(
                            "rounded-md border border-border bg-transparent hover:bg-muted/50 transition-colors",
                            isMobile ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]"
                        )}
                    >
                        <span className="text-muted-foreground font-medium">{label}</span>
                    </Link>
                );
            })}

            <button
                onClick={handleAddOpen}
                className={cn(
                    "flex items-center gap-1 rounded-md border border-primary hover:bg-primary/10 transition-colors",
                    isMobile ? "px-2 py-1 text-[10px]" : "px-2.5 py-1 text-[11px]"
                )}
            >
                <Plus className={cn(isMobile ? "h-2.5 w-2.5" : "h-3 w-3", "text-primary")} />
                <span className="text-primary font-medium">Add</span>
            </button>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Interview Round</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Interview Type</Label>
                        <Controller
                            name="interview_type"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
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
                    </div>

                    <div className="space-y-2">
                        <Label>Scheduled Date</Label>
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
                            placeholder="60"
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
                            onClick={() => setIsAddOpen(false)}
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
        </>
    );
}
