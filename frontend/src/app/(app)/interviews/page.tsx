'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Plus } from 'lucide-react';
import { startOfDay, parseISO } from 'date-fns';

import { InterviewTable } from './interview-table/interview-table';
import { columns } from './interview-table/columns';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    listInterviews,
    InterviewListItem,
    type InterviewFilter,
} from '@/services/interview-service';
import {
    NeedsFeedbackSection,
    FilterBar,
    filterNeedsFeedback,
} from '@/components/interview-list';

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

const InterviewPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [allInterviews, setAllInterviews] = useState<InterviewListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchInterviews = async () => {
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
        };

        fetchInterviews();
    }, []);

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
                        <Link href="/applications">
                            <Button variant="default" size="sm">
                                <Plus size={16} className="mr-1" />
                                Interview
                            </Button>
                        </Link>
                    ) : undefined
                }
            />

            {!hasInterviews ? (
                <div className="flex flex-col items-center justify-center py-16 border rounded-lg bg-muted/20">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No upcoming interviews</h3>
                    <p className="text-muted-foreground mb-4">
                        Schedule your first interview to get started
                    </p>
                    <Link href="/applications">
                        <Button variant="default">
                            <Plus size={16} className="mr-1" />
                            Interview
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    <NeedsFeedbackSection interviews={allInterviews} />

                    <section className="space-y-4">
                        <FilterBar
                            currentFilter={currentFilter}
                            onFilterChange={handleFilterChange}
                            totalCount={mainTableInterviews.length}
                        />
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
                    </section>
                </div>
            )}
        </>
    );
};

export default InterviewPage;
