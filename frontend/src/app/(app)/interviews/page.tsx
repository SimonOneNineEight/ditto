'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, Loader2, Plus } from 'lucide-react';
import { startOfDay, parseISO } from 'date-fns';

import { InterviewTable } from './interview-table/interview-table';
import { columns } from './interview-table/columns';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FAB } from '@/components/ui/fab';
import {
    listInterviews,
    InterviewListItem,
    type InterviewFilter,
} from '@/services/interview-service';
import {
    NeedsFeedbackSection,
    FilterBar,
    filterNeedsFeedback,
    InterviewCardList,
} from '@/components/interview-list';
import { ApplicationSelectorDialog } from '@/components/application-selector';
import { InterviewFormModal } from '@/components/interview-form/interview-form-modal';

const InterviewsPageSkeleton = () => (
    <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>
);

function applyClientFilter(
    interviews: InterviewListItem[],
    filter: InterviewFilter
): InterviewListItem[] {
    const today = startOfDay(new Date());

    return interviews.filter((interview) => {
        const interviewDate = startOfDay(parseISO(interview.scheduled_date));

        switch (filter) {
            case 'upcoming':
                return interviewDate >= today;
            case 'past':
                return interviewDate < today;
            case 'all':
            default:
                return true;
        }
    });
}

function filterMainTableInterviews(interviews: InterviewListItem[]): InterviewListItem[] {
    const needsFeedback = filterNeedsFeedback(interviews);
    const needsFeedbackIds = new Set(needsFeedback.map((i) => i.id));
    return interviews.filter((interview) => !needsFeedbackIds.has(interview.id));
}

const InterviewPageContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [allInterviews, setAllInterviews] = useState<InterviewListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAppSelector, setShowAppSelector] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [showInterviewModal, setShowInterviewModal] = useState(false);

    const currentFilter = (searchParams.get('filter') as InterviewFilter) || 'all';

    const handleFilterChange = useCallback(
        (filter: InterviewFilter) => {
            const params = new URLSearchParams(searchParams.toString());
            if (filter === 'all') {
                params.delete('filter');
            } else {
                params.set('filter', filter);
            }
            const queryString = params.toString();
            router.push(queryString ? `?${queryString}` : '/interviews');
        },
        [router, searchParams]
    );

    const fetchInterviews = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await listInterviews();
            setAllInterviews(data.interviews);
        } catch (err) {
            console.error('Failed to fetch interviews:', err);
            setError('Failed to load interviews');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInterviews();
    }, [fetchInterviews]);

    const handleAddInterview = () => {
        setShowAppSelector(true);
    };

    const handleAppSelected = (applicationId: string) => {
        setSelectedAppId(applicationId);
        setShowAppSelector(false);
        setShowInterviewModal(true);
    };

    const handleInterviewCreated = () => {
        setShowInterviewModal(false);
        setSelectedAppId(null);
        fetchInterviews();
    };

    const filteredInterviews = useMemo(
        () => applyClientFilter(allInterviews, currentFilter),
        [allInterviews, currentFilter]
    );

    const mainTableInterviews = useMemo(
        () => filterMainTableInterviews(filteredInterviews),
        [filteredInterviews]
    );

    if (loading) {
        return (
            <>
                <PageHeader
                    title="Interviews"
                    subtitle="Manage all your upcoming and past interviews"
                />
                <InterviewsPageSkeleton />
            </>
        );
    }

    if (error) {
        return (
            <>
                <PageHeader
                    title="Interviews"
                    subtitle="Manage all your upcoming and past interviews"
                />
                <div className="text-center py-12">
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </>
        );
    }

    const hasInterviews = allInterviews.length > 0;

    return (
        <>
            <PageHeader
                title="Interviews"
                subtitle="Manage all your upcoming and past interviews"
                actions={
                    hasInterviews ? (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleAddInterview}
                            className="hidden md:flex"
                        >
                            <Plus size={16} className="mr-1" />
                            Interview
                        </Button>
                    ) : undefined
                }
            />

            {!hasInterviews ? (
                <div className="flex flex-col items-center justify-center border border-border rounded-lg p-10 gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                        <Calendar className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold">No interviews scheduled</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                        Schedule your first interview to start tracking your progress.
                    </p>
                    <Button variant="default" onClick={handleAddInterview}>
                        <Plus size={16} className="mr-1" />
                        Interview
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    <NeedsFeedbackSection interviews={allInterviews} />

                    <section className="space-y-4">
                        <FilterBar
                            currentFilter={currentFilter}
                            onFilterChange={handleFilterChange}
                            totalCount={mainTableInterviews.length}
                        />
                        {/* Mobile: Card view */}
                        <div className="sm:hidden">
                            <InterviewCardList interviews={mainTableInterviews} />
                        </div>
                        {/* Tablet/Desktop: Table view */}
                        <div className="hidden sm:block">
                            {mainTableInterviews.length > 0 ? (
                                <InterviewTable
                                    columns={columns}
                                    data={mainTableInterviews}
                                />
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No interviews match the current filter
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* Mobile FAB */}
            {hasInterviews && (
                <FAB
                    className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-50 md:hidden"
                    aria-label="Add new interview"
                    onClick={handleAddInterview}
                >
                    <Plus className="h-6 w-6" />
                </FAB>
            )}

            <ApplicationSelectorDialog
                open={showAppSelector}
                onOpenChange={setShowAppSelector}
                onSelect={handleAppSelected}
            />

            {selectedAppId && (
                <InterviewFormModal
                    applicationId={selectedAppId}
                    open={showInterviewModal}
                    onOpenChange={setShowInterviewModal}
                    onSuccess={handleInterviewCreated}
                />
            )}
        </>
    );
};

const InterviewPage = () => (
    <Suspense fallback={
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    }>
        <InterviewPageContent />
    </Suspense>
);

export default InterviewPage;
