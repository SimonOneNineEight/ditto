'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Pencil, Trash2, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { sanitizeHtml } from '@/lib/sanitizer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
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
} from '@/components/ui/breadcrumb';
import {
    getApplication,
    deleteApplication,
    type ApplicationWithDetails,
} from '@/services/application-service';
import {
    listInterviews,
    getInterviewTypeLabel,
    type InterviewListItem,
} from '@/services/interview-service';
import {
    listAssessments,
    type Assessment,
    type AssessmentStatus,
} from '@/services/assessment-service';
import { AssessmentList } from '@/components/assessment-list';
import { AssessmentFormModal } from '@/components/assessment-form';

const statusVariantMap: Record<string, 'applied' | 'screening' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn' | 'default'> = {
    'Applied': 'applied',
    'Screening': 'screening',
    'Interviewing': 'interviewing',
    'Offered': 'offered',
    'Rejected': 'rejected',
    'Withdrawn': 'withdrawn',
};

interface TimelineEvent {
    title: string;
    subtitle?: string;
    subtitleColor?: string;
    date: string;
    isPrimary: boolean;
    outcome?: string;
    isOverdue?: boolean;
    isDueSoon?: boolean;
    href?: string;
}

const ASSESSMENT_STATUS_COLORS: Record<string, string> = {
    submitted: '#eab308',
    passed: '#22c55e',
    failed: '#ef4444',
};

function buildTimeline(
    app: ApplicationWithDetails,
    interviews: InterviewListItem[],
    assessments: Assessment[]
): TimelineEvent[] {
    const events: TimelineEvent[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    events.push({
        title: 'Application Submitted',
        date: app.applied_at,
        isPrimary: false,
    });

    for (const interview of interviews) {
        const typeLabel = getInterviewTypeLabel(interview.interview_type);
        events.push({
            title: `${typeLabel} Interview - Round ${interview.round_number}`,
            subtitle: interview.outcome ? `Outcome: ${interview.outcome}` : undefined,
            date: interview.scheduled_date,
            isPrimary: false,
            outcome: interview.outcome || undefined,
            href: `/interviews/${interview.id}`,
        });
    }

    for (const assessment of assessments) {
        const dueDate = new Date(assessment.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntilDue < 0;
        const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

        const completedStatuses = ['submitted', 'passed', 'failed'];
        const isCompleted = completedStatuses.includes(assessment.status);

        events.push({
            title: `Assessment: ${assessment.title}`,
            subtitle: !isCompleted
                ? (isOverdue ? 'Overdue' : isDueSoon ? `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}` : undefined)
                : `Status: ${assessment.status}`,
            subtitleColor: isCompleted ? ASSESSMENT_STATUS_COLORS[assessment.status] : undefined,
            date: assessment.due_date,
            isPrimary: false,
            isOverdue: !isCompleted && isOverdue,
            isDueSoon: !isCompleted && isDueSoon,
            href: `/applications/${app.id}/assessments/${assessment.id}`,
        });
    }

    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (events.length > 0) {
        events[events.length - 1].isPrimary = true;
    }

    return events;
}

function getEventDotColor(event: TimelineEvent): string {
    if (event.isOverdue) return 'bg-red-500';
    if (event.isDueSoon) return 'bg-orange-500';
    if (event.outcome) {
        const lower = event.outcome.toLowerCase();
        if (lower === 'passed' || lower === 'accepted') return 'bg-green-500';
        if (lower === 'failed' || lower === 'rejected') return 'bg-red-500';
        return 'bg-yellow-500';
    }
    if (event.isPrimary) return 'bg-primary';
    return 'bg-muted-foreground/40';
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col py-4 sm:py-6 w-full gap-4 sm:gap-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
                <div className="space-y-4 sm:space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}

function formatSalary(min?: number, max?: number, currency?: string) {
    if (!min && !max) return '—';
    const sym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    const fmt = (n: number) => `${sym}${n.toLocaleString()}`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return `Up to ${fmt(max!)}`;
}

const ApplicationPage = () => {
    const params = useParams();
    const router = useRouter();
    const applicationId = params.id as string;

    const [app, setApp] = useState<ApplicationWithDetails | null>(null);
    const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isJdExpanded, setIsJdExpanded] = useState(false);
    const [isNotesExpanded, setIsNotesExpanded] = useState(false);
    const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [applicationData, interviewData, assessmentData] = await Promise.all([
                    getApplication(applicationId),
                    listInterviews({ limit: 1000 }),
                    listAssessments(applicationId),
                ]);

                if (!applicationData) {
                    setError('Application not found');
                    return;
                }

                setApp(applicationData);
                setInterviews(
                    interviewData.interviews.filter(
                        (i) => i.application_id === applicationId
                    )
                );
                setAssessments(assessmentData);
            } catch {
                setError('Failed to load application');
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [applicationId]);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteApplication(applicationId);
            toast.success('Application deleted');
            router.push('/applications');
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    };

    if (loading) return <LoadingSkeleton />;

    if (error || !app) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <p className="text-muted-foreground">{error || 'Application not found'}</p>
                <Button variant="outline" onClick={() => router.push('/applications')}>
                    Back to Applications
                </Button>
            </div>
        );
    }

    const positionTitle = app.job?.title || 'Untitled Position';
    const statusName = app.status?.name;
    const statusVariant = statusName ? (statusVariantMap[statusName] || 'default') : 'default';
    const timeline = buildTimeline(app, interviews, assessments);

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
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header Section */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
                    {/* Title Row */}
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
                        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-semibold text-foreground">
                            {positionTitle}
                        </h1>
                        {statusName && (
                            <Badge variant={statusVariant} className="hidden sm:inline-flex">
                                {statusName}
                            </Badge>
                        )}
                    </div>

                    {/* Company Row */}
                    {app.company?.name && (
                        <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="text-sm sm:text-base truncate">{app.company.name}</span>
                        </div>
                    )}

                    {/* Status badge - mobile only (shown inline with title on desktop) */}
                    {statusName && (
                        <Badge variant={statusVariant} className="sm:hidden w-fit">
                            {statusName}
                        </Badge>
                    )}
                </div>

                {/* Action Buttons - Desktop/Tablet */}
                <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit application"
                        onClick={() => router.push(`/applications/${applicationId}/edit`)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete application"
                        onClick={() => setIsDeleteOpen(true)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                {/* Action Menu - Mobile only */}
                <div className="sm:hidden flex-shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Application actions">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/applications/${applicationId}/edit`)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Application
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Application
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Two-column layout - stacked on mobile/tablet, side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
                {/* Main content column */}
                <div className="flex flex-col gap-4 sm:gap-6">
                    {/* Application Details card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Application Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Applied Date</span>
                                    <span className="text-sm">
                                        {app.applied_at
                                            ? format(new Date(app.applied_at), 'MMM d, yyyy')
                                            : '—'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Job Type</span>
                                    <span className="text-sm">{app.job?.job_type || '—'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Location</span>
                                    <span className="text-sm">{app.job?.location || '—'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Remote</span>
                                    <span className="text-sm">—</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Salary Range</span>
                                    <span className="text-sm">{formatSalary(app.job?.min_salary, app.job?.max_salary, app.job?.currency)}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">Source</span>
                                    {app.job?.source_url ? (
                                        <a
                                            href={app.job.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline truncate"
                                        >
                                            {app.job.platform || app.job.source_url}
                                        </a>
                                    ) : (
                                        <span className="text-sm">—</span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Job Description card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-base">Job Description</CardTitle>
                            {app.job?.job_description && (
                                <button
                                    onClick={() => setIsJdExpanded(!isJdExpanded)}
                                    aria-expanded={isJdExpanded}
                                    aria-label={isJdExpanded ? 'Collapse job description' : 'Expand job description'}
                                    className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                                >
                                    {isJdExpanded ? (
                                        <ChevronUp className="h-[18px] w-[18px]" />
                                    ) : (
                                        <ChevronDown className="h-[18px] w-[18px]" />
                                    )}
                                </button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {!app.job?.job_description ? (
                                <p className="text-sm text-muted-foreground/60 italic">No job description provided</p>
                            ) : isJdExpanded ? (
                                <div
                                    className="prose prose-sm prose-invert max-w-none text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(app.job.job_description) }}
                                />
                            ) : (
                                <div className="relative max-h-[80px] overflow-hidden">
                                    <div
                                        className="prose prose-sm prose-invert max-w-none text-muted-foreground"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(app.job.job_description) }}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-base">Notes</CardTitle>
                            <button
                                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                                aria-expanded={isNotesExpanded}
                                aria-label={isNotesExpanded ? 'Collapse notes' : 'Expand notes'}
                                className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                            >
                                {isNotesExpanded ? (
                                    <ChevronUp className="h-[18px] w-[18px]" />
                                ) : (
                                    <ChevronDown className="h-[18px] w-[18px]" />
                                )}
                            </button>
                        </CardHeader>
                        <CardContent>
                            {!app.notes ? (
                                <p className="text-sm text-muted-foreground/60 italic">No notes provided</p>
                            ) : isNotesExpanded ? (
                                <div
                                    className="prose prose-sm prose-invert max-w-none text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(app.notes) }}
                                />
                            ) : (
                                <div className="relative max-h-[80px] overflow-hidden">
                                    <div
                                        className="prose prose-sm prose-invert max-w-none text-muted-foreground"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(app.notes) }}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assessments card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 md:p-5 pb-4">
                            <CardTitle className="text-base">Assessments</CardTitle>
                            {assessments.length > 0 && (
                                <Button variant="ghost-primary" size="sm" onClick={() => setIsAssessmentModalOpen(true)}>
                                    + Add Assessment
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-4 md:p-5 pt-0 md:pt-0">
                            <AssessmentList
                                assessments={assessments}
                                applicationId={applicationId}
                                onAddClick={() => setIsAssessmentModalOpen(true)}
                                onStatusUpdate={(id, newStatus) => {
                                    setAssessments((prev) =>
                                        prev.map((a) =>
                                            a.id === id ? { ...a, status: newStatus as AssessmentStatus } : a
                                        )
                                    );
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Timeline column - full width on mobile/tablet, fixed width on desktop */}
                <div className="w-full">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {timeline.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No events yet</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {timeline.map((event, index) => {
                                        const content = (
                                            <div className={`flex gap-3 ${event.href ? 'cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-1 rounded' : ''}`}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${getEventDotColor(event)}`} />
                                                    {index < timeline.length - 1 && (
                                                        <div className="w-px flex-1 bg-border mt-1" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5 pb-4">
                                                    <span className={`text-sm font-medium ${event.isOverdue ? 'text-red-400' : ''}`}>
                                                        {event.title}
                                                    </span>
                                                    {event.subtitle && (
                                                        <span
                                                            className={`text-xs ${event.isOverdue ? 'text-red-400' : event.isDueSoon ? 'text-orange-400' : !event.subtitleColor ? 'text-muted-foreground' : ''}`}
                                                            style={event.subtitleColor ? { color: event.subtitleColor } : undefined}
                                                        >
                                                            {event.subtitle}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(event.date), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        );

                                        return event.href ? (
                                            <Link key={index} href={event.href}>
                                                {content}
                                            </Link>
                                        ) : (
                                            <div key={index}>{content}</div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <DeleteConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title="Delete Application"
                description="Are you sure you want to delete this application? This action cannot be undone."
                isDeleting={isDeleting}
                destructive
            />

            <AssessmentFormModal
                applicationId={applicationId}
                open={isAssessmentModalOpen}
                onOpenChange={setIsAssessmentModalOpen}
                onSuccess={async () => {
                    const refreshed = await listAssessments(applicationId);
                    setAssessments(refreshed);
                }}
            />
        </div>
    );
};

export default ApplicationPage;
