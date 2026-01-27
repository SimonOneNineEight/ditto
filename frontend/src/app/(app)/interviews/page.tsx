'use client';

import { useEffect, useState } from 'react';
import { isBefore, parseISO, startOfDay } from 'date-fns';

import { InterivewTable } from './interview-table/interview-table';
import { columns } from './interview-table/columns';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { listInterviews, InterviewListItem } from '@/services/interview-service';

const InterviewsPageSkeleton = () => (
    <div className="space-y-6">
        <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>
);

const InterviewPage = () => {
    const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await listInterviews();
                setInterviews(data);
            } catch (err) {
                console.error('Failed to fetch interviews:', err);
                setError('Failed to load interviews');
            } finally {
                setLoading(false);
            }
        };

        fetchInterviews();
    }, []);

    if (loading) {
        return (
            <>
                <PageHeader
                    title="Interviews"
                    subtitle="Prepare for and track your upcoming interviews"
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
                    subtitle="Prepare for and track your upcoming interviews"
                />
                <div className="text-center py-12">
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </>
        );
    }

    // Split interviews into upcoming and past
    const today = startOfDay(new Date());
    const upcomingInterviews = interviews.filter((interview) => {
        const interviewDate = startOfDay(parseISO(interview.scheduled_date));
        return !isBefore(interviewDate, today);
    });
    const pastInterviews = interviews.filter((interview) => {
        const interviewDate = startOfDay(parseISO(interview.scheduled_date));
        return isBefore(interviewDate, today);
    });

    return (
        <>
            <PageHeader
                title="Interviews"
                subtitle="Prepare for and track your upcoming interviews"
            />
            <section className="min-w-0">
                <h3 className="mb-4">Upcoming</h3>
                {upcomingInterviews.length > 0 ? (
                    <InterivewTable columns={columns} data={upcomingInterviews} />
                ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        No upcoming interviews scheduled
                    </div>
                )}
            </section>
            <section className="mt-8">
                <h3 className="mb-4">Past</h3>
                {pastInterviews.length > 0 ? (
                    <InterivewTable columns={columns} data={pastInterviews} />
                ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                        No past interviews
                    </div>
                )}
            </section>
        </>
    );
};

export default InterviewPage;
