'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, Plus, Calendar, Building2, MoreVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { AssessmentDetailSkeleton } from '@/components/loading-skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { getCountdownInfo } from '@/components/assessment-list';
import {
    getAssessmentDetails,
    deleteAssessment,
    updateAssessmentStatus,
    getAssessmentTypeLabel,
    type Assessment,
    type AssessmentSubmission,
    type AssessmentStatus,
} from '@/services/assessment-service';
import { getApplication, type ApplicationWithDetails } from '@/services/application-service';
import { AssessmentStatusSelect } from '@/components/assessment-status-select';
import { SubmissionFormModal } from '@/components/submission-form';
import { SubmissionList } from '@/components/submission-list';

const AssessmentDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;
    const assessmentId = params.assessmentId as string;

    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [application, setApplication] = useState<ApplicationWithDetails | null>(null);
    const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [assessmentData, applicationData] = await Promise.all([
                getAssessmentDetails(assessmentId),
                getApplication(applicationId),
            ]);
            setAssessment(assessmentData.assessment);
            setSubmissions(assessmentData.submissions);
            setApplication(applicationData);
        } catch {
            setError('Failed to load assessment');
        } finally {
            setLoading(false);
        }
    }, [assessmentId, applicationId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusChange = async (newStatus: AssessmentStatus) => {
        if (!assessment || isUpdatingStatus) return;

        const previousStatus = assessment.status;

        // Optimistic update - update UI immediately
        setAssessment({ ...assessment, status: newStatus });
        setIsUpdatingStatus(true);

        try {
            const updated = await updateAssessmentStatus(assessmentId, newStatus);
            setAssessment(updated);
            toast.success('Status updated');
        } catch {
            // Revert on error
            setAssessment({ ...assessment, status: previousStatus });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleSubmittedSelect = () => {
        setIsSubmissionModalOpen(true);
    };

    const handleSubmissionSuccess = (newSubmission: AssessmentSubmission) => {
        setSubmissions((prev) => [newSubmission, ...prev]);
    };

    const handleSubmissionDeleted = (submissionId: string) => {
        setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteAssessment(assessmentId);
            toast.success('Assessment deleted');
            router.push(`/applications/${applicationId}`);
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    };

    if (loading) return <AssessmentDetailSkeleton />;

    if (error || !assessment) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <p className="text-muted-foreground">
                    {error || 'Assessment not found'}
                </p>
                <Button
                    variant="outline"
                    onClick={() => router.push(`/applications/${applicationId}`)}
                >
                    Back to Application
                </Button>
            </div>
        );
    }

    const countdown = getCountdownInfo(assessment.due_date, assessment.status);

    return (
        <div className="flex flex-col py-4 sm:py-6 w-full gap-4 sm:gap-6">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/applications">Applications</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href={`/applications/${applicationId}`}>
                                {application?.company?.name || 'Application'}
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <span className="text-muted-foreground">Assessment</span>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header Section */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                    {/* Title */}
                    <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold text-foreground">
                        {assessment.title}
                    </h1>

                    {/* Company Row */}
                    {application && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="text-sm truncate">
                                {application.company?.name} - {application.job?.title}
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Buttons - Desktop/Tablet */}
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete assessment"
                        onClick={() => setIsDeleteOpen(true)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Action Menu - Mobile only */}
                <div className="sm:hidden flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Assessment actions">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Assessment
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6">
                {/* Assessment Details Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Assessment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 sm:gap-4">
                            {/* Row 1: Due Date | Assessment Type */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Due Date</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-sm">
                                            {format(parseISO(assessment.due_date), 'MMMM d, yyyy')}
                                        </span>
                                        <span
                                            className="text-sm font-medium"
                                            style={{ color: countdown.color }}
                                        >
                                            {countdown.text}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Assessment Type</span>
                                    <span className="text-sm">
                                        {getAssessmentTypeLabel(assessment.assessment_type)}
                                    </span>
                                </div>
                            </div>
                            {/* Row 2: Status */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-muted-foreground">Status</span>
                                <div>
                                    <AssessmentStatusSelect
                                        value={assessment.status}
                                        onChange={handleStatusChange}
                                        onSubmittedSelect={handleSubmittedSelect}
                                        disabled={isUpdatingStatus}
                                        variant="badge"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Instructions Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {assessment.instructions ? (
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {assessment.instructions}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground/60 italic">
                                No instructions provided
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Requirements Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base">Requirements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {assessment.requirements ? (
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {assessment.requirements}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground/60 italic">
                                No requirements provided
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Submissions Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Submissions</CardTitle>
                            <Button
                                size="sm"
                                onClick={() => setIsSubmissionModalOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Submission
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <SubmissionList
                            submissions={submissions}
                            onSubmissionDeleted={handleSubmissionDeleted}
                        />
                    </CardContent>
                </Card>
            </div>

            <SubmissionFormModal
                assessmentId={assessmentId}
                applicationId={applicationId}
                open={isSubmissionModalOpen}
                onOpenChange={setIsSubmissionModalOpen}
                onSuccess={handleSubmissionSuccess}
            />

            <DeleteConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title="Delete Assessment"
                description="Are you sure you want to delete this assessment? This action cannot be undone."
                isDeleting={isDeleting}
                destructive
            />
        </div>
    );
};

export default AssessmentDetailPage;
