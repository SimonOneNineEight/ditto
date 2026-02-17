'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, TrendingUp, Calendar, Trophy, AlertCircle, RefreshCw, Plus, FileText, CalendarPlus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { FAB } from '@/components/ui/fab';
import { DashboardStatsSkeleton } from '@/components/loading-skeleton';
import { getStats, DashboardStats } from '@/services/dashboard-service';
import { ApplicationSelectorDialog } from '@/components/application-selector';
import { InterviewFormModal } from '@/components/interview-form/interview-form-modal';
import { UpcomingWidget, RecentApplications } from './dashboard/components';
import { NotificationCenter } from '@/components/notification-center';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Dashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAppSelector, setShowAppSelector] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [showInterviewModal, setShowInterviewModal] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
            setError('Failed to load dashboard statistics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleStatClick = (filter?: string) => {
        if (filter) {
            router.push(`/applications?status=${filter}`);
        } else {
            router.push('/applications');
        }
    };

    const handleAddApplication = () => {
        router.push('/applications/new');
    };

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
        router.push('/interviews');
    };

    const quickActions = (
        <div className="flex items-center gap-2 desktop:gap-3">
            <div className="hidden desktop:block">
                <NotificationCenter />
            </div>
            <Button
                onClick={handleAddInterview}
                aria-label="Add new interview"
                size="default"
                className="hidden desktop:flex"
            >
                <Plus className="mr-2 h-4 w-4" />
                Interview
            </Button>
            <Button
                onClick={handleAddApplication}
                aria-label="Add new application"
                size="default"
                className="hidden desktop:flex"
            >
                <Plus className="mr-2 h-4 w-4" />
                Application
            </Button>
        </div>
    );

    if (error) {
        return (
            <>
                <PageHeader
                    title="Dashboard"
                    subtitle="Welcome back! Here's an overview of your job search"
                    actions={quickActions}
                />
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">{error}</p>
                    <Button variant="outline" onClick={fetchStats}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </div>

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
    }

    return (
        <>
            <PageHeader
                title="Dashboard"
                subtitle="Welcome back! Here's an overview of your job search"
                actions={quickActions}
            />

            {loading ? (
                <DashboardStatsSkeleton count={4} />
            ) : (
                <div className="grid grid-cols-2 desktop:grid-cols-4 gap-4 desktop:gap-6">
                    <StatCard
                        label="Total Applications"
                        value={stats?.total_applications ?? 0}
                        icon={Briefcase}
                        onClick={() => handleStatClick()}
                    />
                    <StatCard
                        label="Active"
                        value={stats?.active_applications ?? 0}
                        icon={TrendingUp}
                        onClick={() => handleStatClick('saved,applied,interview')}
                    />
                    <StatCard
                        label="Interviews"
                        value={stats?.interview_count ?? 0}
                        icon={Calendar}
                        onClick={() => handleStatClick('interview')}
                    />
                    <StatCard
                        label="Offers"
                        value={stats?.offer_count ?? 0}
                        icon={Trophy}
                        variant="accent"
                        onClick={() => handleStatClick('offer')}
                    />
                </div>
            )}

            <div className="mt-6 md:mt-8">
                <UpcomingWidget />
            </div>

            <div className="mt-6 md:mt-8">
                <RecentApplications />
            </div>

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

            {/* Mobile FAB with expandable options */}
            <div className="fixed bottom-4 right-4 z-50 md:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <FAB aria-label="Create new item">
                            <Plus className="h-6 w-6" />
                        </FAB>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-48">
                        <DropdownMenuItem onClick={handleAddApplication} className="py-3">
                            <FileText className="mr-2 h-4 w-4" />
                            New Application
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleAddInterview} className="py-3">
                            <CalendarPlus className="mr-2 h-4 w-4" />
                            New Interview
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
}
