'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, Pencil, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import PageHeader from '@/components/page-header/page-header';
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
    date: string;
    isPrimary: boolean;
    outcome?: string;
}

function buildTimeline(app: ApplicationWithDetails, interviews: InterviewListItem[]): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    // Add "Application Submitted" event
    events.push({
        title: 'Application Submitted',
        date: app.applied_at,
        isPrimary: false,
    });

    // Add interview events
    for (const interview of interviews) {
        const typeLabel = getInterviewTypeLabel(interview.interview_type);
        events.push({
            title: `${typeLabel} Interview - Round ${interview.round_number}`,
            subtitle: interview.outcome ? `Outcome: ${interview.outcome}` : undefined,
            date: interview.scheduled_date,
            isPrimary: false,
            outcome: interview.outcome || undefined,
        });
    }

    // Sort by date ascending
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Mark the most recent event as primary
    if (events.length > 0) {
        events[events.length - 1].isPrimary = true;
    }

    return events;
}

function getOutcomeDotColor(outcome?: string): string {
    if (!outcome) return '';
    const lower = outcome.toLowerCase();
    if (lower === 'passed' || lower === 'accepted') return 'bg-green-500';
    if (lower === 'failed' || lower === 'rejected') return 'bg-red-500';
    return 'bg-yellow-500';
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col p-6 w-full gap-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-6">
                <div className="flex-1 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-64 w-[320px]" />
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isJdExpanded, setIsJdExpanded] = useState(false);
    const [isNotesExpanded, setIsNotesExpanded] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const [applicationData, interviewData] = await Promise.all([
                    getApplication(applicationId),
                    listInterviews({ limit: 1000 }),
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
            toast.error('Failed to delete application');
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
    const timeline = buildTimeline(app, interviews);

    return (
        <div className="flex flex-col p-8 w-full">
            <PageHeader
                title={positionTitle}
                titleExtra={statusName ? <Badge variant={statusVariant}>{statusName}</Badge> : undefined}
                subtitle={app.company?.name ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span className="text-base">{app.company.name}</span>
                    </div>
                ) : undefined}
                breadcrumbs={[{ label: 'Applications', href: '/applications' }]}
                actions={
                    <>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(`/applications/${applicationId}/edit`)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsDeleteOpen(true)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                }
            />

            {/* Two-column layout */}
            <div className="flex gap-6">
                {/* Left column */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Application Details card */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Application Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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
                    {app.job?.job_description && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                <CardTitle className="text-base">Job Description</CardTitle>
                                <button
                                    onClick={() => setIsJdExpanded(!isJdExpanded)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    {isJdExpanded ? (
                                        <ChevronUp className="h-[18px] w-[18px]" />
                                    ) : (
                                        <ChevronDown className="h-[18px] w-[18px]" />
                                    )}
                                </button>
                            </CardHeader>
                            <CardContent>
                                {isJdExpanded ? (
                                    <p className="text-sm leading-normal text-muted-foreground whitespace-pre-line">
                                        {app.job.job_description}
                                    </p>
                                ) : (
                                    <div className="relative max-h-[80px] overflow-hidden">
                                        <p className="text-sm leading-normal text-muted-foreground whitespace-pre-line">
                                            {app.job.job_description}
                                        </p>
                                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-base">Notes</CardTitle>
                            <button
                                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                                className="text-muted-foreground hover:text-foreground"
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
                                <p className="text-sm text-muted-foreground">No notes yet</p>
                            ) : isNotesExpanded ? (
                                <p className="text-sm leading-normal text-muted-foreground whitespace-pre-line">
                                    {app.notes}
                                </p>
                            ) : (
                                <div className="relative max-h-[80px] overflow-hidden">
                                    <p className="text-sm leading-normal text-muted-foreground whitespace-pre-line">
                                        {app.notes}
                                    </p>
                                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Assessments card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-base">Assessments</CardTitle>
                            <Button size="sm"><Plus className="h-4 w-4" />Assessment</Button>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">No assessments yet</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column */}
                <div className="w-[320px] flex-shrink-0">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base">Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {timeline.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No events yet</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {timeline.map((event, index) => (
                                        <div key={index} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`w-2 h-2 rounded-full mt-1.5 ${
                                                        event.outcome
                                                            ? getOutcomeDotColor(event.outcome)
                                                            : event.isPrimary
                                                              ? 'bg-primary'
                                                              : 'bg-muted-foreground/40'
                                                    }`}
                                                />
                                                {index < timeline.length - 1 && (
                                                    <div className="w-px flex-1 bg-border mt-1" />
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-0.5 pb-4">
                                                <span className="text-sm font-medium">{event.title}</span>
                                                {event.subtitle && (
                                                    <span className="text-xs text-muted-foreground">{event.subtitle}</span>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(event.date), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
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
        </div>
    );
};

export default ApplicationPage;
