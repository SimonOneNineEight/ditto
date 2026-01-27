'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Calendar, Clock, Timer } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { PageHeader } from '@/components/page-header';
import {
    InterviewersSection,
    QuestionsSection,
    FeedbackSection,
} from '@/components/interview-detail';
import {
    getInterviewWithDetails,
    updateInterview,
    InterviewWithDetails,
    UpdateInterviewRequest,
    INTERVIEW_TYPES,
    getInterviewTypeLabel,
} from '@/services/interview-service';

const editFormSchema = z.object({
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

type EditFormData = z.infer<typeof editFormSchema>;

const InterviewDetailSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
    </div>
);

const InterviewDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id as string;

    const [data, setData] = useState<InterviewWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isValid },
    } = useForm<EditFormData>({
        resolver: zodResolver(editFormSchema),
        mode: 'onChange',
    });

    const fetchInterview = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getInterviewWithDetails(interviewId);
            setData(result);
        } catch (err) {
            console.error('Failed to fetch interview:', err);
            setError('Interview not found or you do not have access to view it.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (interviewId) {
            fetchInterview();
        }
    }, [interviewId]);

    const handleEditOpen = () => {
        if (!data) return;
        reset({
            interview_type: data.interview.interview_type as EditFormData['interview_type'],
            scheduled_date: data.interview.scheduled_date.split('T')[0],
            scheduled_time: data.interview.scheduled_time || '',
            duration_minutes: data.interview.duration_minutes || undefined,
        });
        setIsEditOpen(true);
    };

    const onSubmit = async (formData: EditFormData) => {
        try {
            await updateInterview(interviewId, {
                interview_type: formData.interview_type,
                scheduled_date: formData.scheduled_date,
                scheduled_time: formData.scheduled_time || undefined,
                duration_minutes: formData.duration_minutes,
            });
            toast.success('Interview updated');
            setIsEditOpen(false);
            fetchInterview();
        } catch (err) {
            console.error('Failed to update interview:', err);
            toast.error('Failed to update interview');
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'MMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return null;
        try {
            const [hours, minutes] = timeStr.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes));
            return format(date, 'h:mm a');
        } catch {
            return timeStr;
        }
    };

    if (loading) {
        return (
            <>
                <PageHeader
                    title="Loading..."
                    breadcrumbs={[{ label: 'Interviews', href: '/interviews' }]}
                />
                <InterviewDetailSkeleton />
            </>
        );
    }

    if (error || !data) {
        return (
            <>
                <PageHeader
                    title="Interview Not Found"
                    breadcrumbs={[{ label: 'Interviews', href: '/interviews' }]}
                />
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">
                        {error || 'Interview not found'}
                    </p>
                    <Button variant="outline" onClick={() => router.push('/interviews')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Interviews
                    </Button>
                </div>
            </>
        );
    }

    const { interview, application, interviewers, questions, notes } = data;

    return (
        <>
            <PageHeader
                title={`${application.company_name} - Round ${interview.round_number}`}
                subtitle={application.job_title}
                breadcrumbs={[{ label: 'Interviews', href: '/interviews' }]}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleEditOpen}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>
                }
            />

            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(interview.scheduled_date)}</span>
                </div>
                {interview.scheduled_time && (
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(interview.scheduled_time)}</span>
                    </div>
                )}
                {interview.duration_minutes && (
                    <div className="flex items-center gap-1.5">
                        <Timer className="h-4 w-4" />
                        <span>{interview.duration_minutes} min</span>
                    </div>
                )}
                <Badge variant="secondary">
                    {getInterviewTypeLabel(interview.interview_type)}
                </Badge>
            </div>

            <div className="space-y-4">
                <InterviewersSection
                    interviewers={interviewers}
                    interviewId={interviewId}
                    onUpdate={fetchInterview}
                />

                <QuestionsSection
                    questions={questions}
                    interviewId={interviewId}
                    onUpdate={fetchInterview}
                />

                <FeedbackSection
                    notes={notes}
                    interviewId={interviewId}
                    onUpdate={fetchInterview}
                />
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Interview</DialogTitle>
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
                                                <SelectItem key={type.value} value={type.value}>
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
                                {...register('duration_minutes', { valueAsNumber: true })}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || !isValid}>
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default InterviewDetailPage;
