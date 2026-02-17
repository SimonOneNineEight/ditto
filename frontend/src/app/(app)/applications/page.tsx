'use client';

import { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApplicationTable } from './application-table';
import { createColumns } from './application-table/columns';
import { ApplicationFilters } from './application-filters';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { FAB } from '@/components/ui/fab';
import { Plus, Download } from 'lucide-react';
import { ExportDialog } from '@/components/export-dialog';
import {
    getApplications,
    getApplicationStatuses,
    deleteApplication,
    type ApplicationWithDetails,
    type ApplicationStatus,
    type ApplicationFilters as Filters,
    type SortColumn,
    type SortOrder,
} from '@/services/application-service';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { ApplicationListSkeleton } from '@/components/loading-skeleton';

const ApplicationPageContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
    const [statuses, setStatuses] = useState<ApplicationStatus[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const limit = 50;

    // Read filters from URL params
    const getFiltersFromURL = useCallback((): Filters => {
        const sortBy = searchParams.get('sort_by') as SortColumn | null;
        const sortOrder = searchParams.get('sort_order') as SortOrder | null;
        const statusIdsParam = searchParams.get('status_ids');
        const hasInterviewsParam = searchParams.get('has_interviews');
        const hasAssessmentsParam = searchParams.get('has_assessments');

        return {
            status_id: searchParams.get('status_id') || undefined,
            status_ids: statusIdsParam ? statusIdsParam.split(',').filter(Boolean) : undefined,
            company_name: searchParams.get('company_name') || undefined,
            date_from: searchParams.get('date_from') || undefined,
            date_to: searchParams.get('date_to') || undefined,
            has_interviews: hasInterviewsParam === 'true' ? true : undefined,
            has_assessments: hasAssessmentsParam === 'true' ? true : undefined,
            sort_by: sortBy || undefined,
            sort_order: sortOrder || undefined,
            page: Number(searchParams.get('page')) || 1,
            limit,
        };
    }, [searchParams]);

    // Update URL params without full reload
    const updateURL = useCallback((filters: Filters) => {
        const params = new URLSearchParams();
        if (filters.status_id) params.set('status_id', filters.status_id);
        if (filters.status_ids && filters.status_ids.length > 0) {
            params.set('status_ids', filters.status_ids.join(','));
        }
        if (filters.company_name) params.set('company_name', filters.company_name);
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);
        if (filters.has_interviews) params.set('has_interviews', 'true');
        if (filters.has_assessments) params.set('has_assessments', 'true');
        if (filters.sort_by) params.set('sort_by', filters.sort_by);
        if (filters.sort_order) params.set('sort_order', filters.sort_order);
        if (filters.page && filters.page > 1) params.set('page', String(filters.page));

        const query = params.toString();
        router.replace(`/applications${query ? `?${query}` : ''}`, { scroll: false });
    }, [router]);

    const fetchApplications = useCallback(async (filters: Filters) => {
        try {
            setLoading(true);
            const result = await getApplications(filters);
            setApplications(result.applications || []);
            setTotal(result.total || 0);
            setPage(result.page || 1);
        } catch {
            toast.error('Failed to load applications');
            setApplications([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch statuses on mount
    useEffect(() => {
        getApplicationStatuses()
            .then(setStatuses)
            .catch(() => { /* statuses are non-critical */ });
    }, []);

    // Fetch applications when URL params change
    useEffect(() => {
        const filters = getFiltersFromURL();
        fetchApplications(filters);
    }, [searchParams, fetchApplications, getFiltersFromURL]);

    const handleFilterChange = useCallback((filters: Filters) => {
        // Reset page when filters change
        const updatedFilters = { ...filters, page: 1 };
        updateURL(updatedFilters);
    }, [updateURL]);

    const handleClearFilters = useCallback(() => {
        router.replace('/applications', { scroll: false });
    }, [router]);

    const handlePageChange = useCallback((newPage: number) => {
        const filters = getFiltersFromURL();
        updateURL({ ...filters, page: newPage });
    }, [getFiltersFromURL, updateURL]);

    const handleSort = useCallback((column: SortColumn) => {
        const filters = getFiltersFromURL();
        let newOrder: SortOrder = 'desc';

        // Toggle order if clicking the same column
        if (filters.sort_by === column) {
            newOrder = filters.sort_order === 'desc' ? 'asc' : 'desc';
        }

        updateURL({ ...filters, sort_by: column, sort_order: newOrder, page: 1 });
    }, [getFiltersFromURL, updateURL]);

    const handleEdit = useCallback((id: string) => {
        router.push(`/applications/${id}/edit`);
    }, [router]);

    const handleDeleteClick = useCallback((id: string) => {
        setDeleteId(id);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteId) return;

        setDeleting(true);
        try {
            await deleteApplication(deleteId);
            toast.success('Application deleted');
            // Refresh the list
            const filters = getFiltersFromURL();
            fetchApplications(filters);
        } catch {
            toast.error('Failed to delete application');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    }, [deleteId, getFiltersFromURL, fetchApplications]);

    const currentFilters = useMemo(() => getFiltersFromURL(), [searchParams]);
    const hasActiveFilters = !!(
        currentFilters.status_id ||
        (currentFilters.status_ids && currentFilters.status_ids.length > 0) ||
        currentFilters.company_name ||
        currentFilters.date_from ||
        currentFilters.date_to ||
        currentFilters.has_interviews ||
        currentFilters.has_assessments
    );

    const [unfilteredTotal, setUnfilteredTotal] = useState<number | undefined>(undefined);

    // Fetch unfiltered total for "Showing X of Y" display
    useEffect(() => {
        getApplications({ page: 1, limit: 1 })
            .then(result => setUnfilteredTotal(result.total))
            .catch(() => { /* non-critical */ });
    }, []);

    const sortState = useMemo(() => ({
        column: currentFilters.sort_by || null,
        order: currentFilters.sort_order || ('desc' as SortOrder),
    }), [currentFilters.sort_by, currentFilters.sort_order]);

    const columns = useMemo(
        () => createColumns({
            onEdit: handleEdit,
            onDelete: handleDeleteClick,
            sortState,
            onSort: handleSort,
        }),
        [handleEdit, handleDeleteClick, sortState, handleSort]
    );

    return (
        <>
            <PageHeader
                title="Applications"
                subtitle="Manage and track all your job applications"
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExportDialogOpen(true)}
                            className="hidden md:flex"
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                        </Button>
                        <Link href="/applications/new" className="hidden md:block">
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Application
                            </Button>
                        </Link>
                    </div>
                }
            />
            <ApplicationFilters
                statuses={statuses}
                currentFilters={currentFilters}
                onFilterChange={handleFilterChange}
                onClear={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
                total={unfilteredTotal}
                filteredCount={total}
            />
            <div className="mt-3">
            {loading ? (
                <div className="rounded-lg border">
                    <ApplicationListSkeleton count={8} />
                </div>
            ) : (
                <ApplicationTable
                    columns={columns}
                    data={applications}
                    total={total}
                    unfilteredTotal={unfilteredTotal}
                    page={page}
                    limit={limit}
                    hasActiveFilters={hasActiveFilters}
                    onPageChange={handlePageChange}
                />
            )}
            </div>

            <DeleteConfirmDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Application"
                description="Are you sure you want to delete this application? This action cannot be undone."
                isDeleting={deleting}
            />

            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                filters={currentFilters}
                totalFiltered={total}
                totalAll={unfilteredTotal}
            />

            {/* Mobile FAB */}
            <Link href="/applications/new" className="md:hidden">
                <FAB
                    className="fixed bottom-4 right-4 z-40"
                    aria-label="Add new application"
                >
                    <Plus className="h-6 w-6" />
                </FAB>
            </Link>
        </>
    );
};

const ApplicationPage = () => (
    <Suspense fallback={
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
    }>
        <ApplicationPageContent />
    </Suspense>
);

export default ApplicationPage;
