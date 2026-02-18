'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Building2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { format, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InterviewDetailSkeleton } from '@/components/loading-skeleton';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    DetailsCard,
    InterviewersCard,
    QuestionsCard,
    NotesCard,
    SelfAssessmentCard,
    DocumentsCard,
} from '@/components/interview-detail';
import {
    getInterviewWithContext,
    updateInterview,
    deleteInterview,
    InterviewWithContext,
    INTERVIEW_TYPES,
    getInterviewTypeLabel,
} from '@/services/interview-service';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import Link from 'next/link';
import { InterviewRoundsPanel } from '@/components/interview-detail/interview-rounds-panel';
import { InterviewRoundsStrip } from '@/components/interview-detail/interview-rounds-strip';

const DURATION_OPTIONS = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '60 minutes' },
    { value: '90', label: '90 minutes' },
    { value: '120', label: '120 minutes' },
];

const editFormSchema = z.object({
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

type EditFormData = z.infer<typeof editFormSchema>;

const getInterviewTypeBadgeVariant = (type: string) => {
    switch (type) {
        case 'phone_screen':
            return 'default';
        case 'technical':
            return 'secondary';
        case 'behavioral':
            return 'outline';
        default:
            return 'secondary';
    }
};

const InterviewDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const interviewId = params.id as string;

    const [data, setData] = useState<InterviewWithContext | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const {
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
            if (!data) setLoading(true);
            setError(null);
            const result = await getInterviewWithContext(interviewId);
            setData(result);
        } catch (err) {
            console.error('Failed to fetch interview:', err);
            setError(
                'Interview not found or you do not have access to view it.'
            );
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
        const interview = data.current_interview.interview;
        reset({
            interview_type:
                interview.interview_type as EditFormData['interview_type'],
            scheduled_date: parseISO(interview.scheduled_date.split('T')[0]),
            scheduled_time: interview.scheduled_time || '',
            duration_minutes: interview.duration_minutes
                ? String(interview.duration_minutes)
                : undefined,
        });
        setIsEditOpen(true);
    };

    const onSubmit = async (formData: EditFormData) => {
        try {
            await updateInterview(interviewId, {
                interview_type: formData.interview_type,
                scheduled_date: format(formData.scheduled_date, 'yyyy-MM-dd'),
                scheduled_time: formData.scheduled_time || undefined,
                duration_minutes: formData.duration_minutes
                    ? parseInt(formData.duration_minutes, 10)
                    : undefined,
            });
            toast.success('Interview updated');
            setIsEditOpen(false);
            fetchInterview();
        } catch (err) {
            console.error('Failed to update interview:', err);
            toast.error('Failed to update interview');
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteInterview(interviewId);
            toast.success('Interview deleted');
            router.push('/interviews');
        } catch (err) {
            console.error('Failed to delete interview:', err);
            toast.error('Failed to delete interview');
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                    <Link
                        href="/interviews"
                        className="hover:text-foreground transition-colors"
                    >
                        Interviews
                    </Link>
                </div>
                <InterviewDetailSkeleton />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="space-y-6">
                <div className="text-sm text-muted-foreground">
                    <Link
                        href="/interviews"
                        className="hover:text-foreground transition-colors"
                    >
                        Interviews
                    </Link>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">
                        {error || 'Interview not found'}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/interviews')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Interviews
                    </Button>
                </div>
            </div>
        );
    }

    const { interview, application, interviewers, questions, notes } =
        data.current_interview;
    const allRounds = data.all_rounds;

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="text-sm text-muted-foreground">
                <Link
                    href="/interviews"
                    className="hover:text-foreground transition-colors"
                >
                    Interviews
                </Link>
            </div>

            {/* Header Section */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 sm:space-y-3 min-w-0 flex-1">
                    {/* Title Row */}
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
                        <h1 className="text-lg sm:text-2xl lg:text-[28px] font-semibold text-foreground">
                            {getInterviewTypeLabel(interview.interview_type)} Interview - Round{' '}
                            {interview.round_number}
                        </h1>
                        <Badge
                            variant={getInterviewTypeBadgeVariant(interview.interview_type)}
                            className="hidden sm:inline-flex"
                        >
                            {getInterviewTypeLabel(interview.interview_type)}
                        </Badge>
                    </div>

                    {/* Company Row */}
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                            {application.company_name} - {application.job_title}
                        </span>
                    </div>
                </div>

                {/* Action Buttons - Desktop/Tablet */}
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit interview"
                        onClick={handleEditOpen}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete interview"
                        onClick={() => setIsDeleteOpen(true)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Action Menu - Mobile only */}
                <div className="sm:hidden flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Interview actions">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleEditOpen}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Interview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                                variant="destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Interview
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Rounds Strip - Tablet only (768px - 1024px) */}
            <div className="hidden sm:block lg:hidden">
                <InterviewRoundsStrip
                    rounds={allRounds}
                    currentRoundId={interviewId}
                    applicationId={interview.application_id}
                    variant="tablet"
                />
            </div>

            {/* Rounds Strip - Mobile only (< 640px) */}
            <div className="sm:hidden">
                <InterviewRoundsStrip
                    rounds={allRounds}
                    currentRoundId={interviewId}
                    applicationId={interview.application_id}
                    variant="mobile"
                />
            </div>

            {/* Content - 2 Column Layout on Desktop, Single Column on Tablet/Mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* Left Column - Main Content */}
                <div className="space-y-6">
                    <DetailsCard interview={interview} />

                    <InterviewersCard
                        interviewers={interviewers}
                        interviewId={interviewId}
                        onUpdate={fetchInterview}
                    />

                    <QuestionsCard
                        questions={questions}
                        interviewId={interviewId}
                        onUpdate={fetchInterview}
                    />

                    <NotesCard
                        notes={notes}
                        interviewId={interviewId}
                        onUpdate={fetchInterview}
                    />

                    <SelfAssessmentCard
                        interview={interview}
                        onUpdate={fetchInterview}
                    />

                    {/* Documents Card - Mobile/Tablet only (in main flow) */}
                    <div className="lg:hidden">
                        <DocumentsCard
                            applicationId={interview.application_id}
                            interviewId={interviewId}
                        />
                    </div>
                </div>

                {/* Right Column - Desktop only */}
                <div className="hidden lg:block space-y-6">
                    <InterviewRoundsPanel
                        rounds={allRounds}
                        currentRoundId={interviewId}
                        applicationId={interview.application_id}
                        onUpdate={fetchInterview}
                    />

                    <DocumentsCard
                        applicationId={interview.application_id}
                        interviewId={interviewId}
                    />
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Interview</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col flex-1 overflow-hidden"
                    >
                      <DialogBody className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-interview-type" className="text-xs font-medium text-muted-foreground">Interview Type</Label>
                            <Controller
                                name="interview_type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger id="edit-interview-type">
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

                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="edit-interview-date" className="text-xs font-medium text-muted-foreground">Date</Label>
                                <Controller
                                    name="scheduled_date"
                                    control={control}
                                    render={({ field }) => (
                                        <DatePicker
                                            id="edit-interview-date"
                                            value={field.value}
                                            onChange={field.onChange}
                                            className="w-full"
                                        />
                                    )}
                                />
                                {errors.scheduled_date && (
                                    <p className="text-sm text-destructive" role="alert">
                                        {errors.scheduled_date.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="edit-interview-time" className="text-xs font-medium text-muted-foreground">Time</Label>
                                <Controller
                                    name="scheduled_time"
                                    control={control}
                                    render={({ field }) => (
                                        <TimePicker
                                            id="edit-interview-time"
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isSubmitting}
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-interview-duration" className="text-xs font-medium text-muted-foreground">Duration</Label>
                            <Controller
                                name="duration_minutes"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? ''}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger id="edit-interview-duration">
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
                                onClick={() => setIsEditOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !isValid}
                            >
                                {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title="Delete Interview"
                description="Are you sure you want to delete this interview? This action cannot be undone and all associated notes, questions, and interviewers will be permanently removed."
                isDeleting={isDeleting}
            />
        </div>
    );
};

export default InterviewDetailPage;
