'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getRecentApplications } from '@/services/dashboard-service';
import { formatJobType } from '@/lib/constants';
import type { ApplicationWithDetails } from '@/services/application-service';

function getStatusVariant(status: string): 'default' | 'applied' | 'interviewing' | 'offered' | 'rejected' {
    const lower = status.toLowerCase();
    if (lower === 'applied') return 'applied';
    if (lower === 'interview') return 'interviewing';
    if (lower === 'offer') return 'offered';
    if (lower === 'rejected') return 'rejected';
    return 'default';
}

function formatAppliedDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentApplications() {
    const router = useRouter();
    const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRecentApplications(10);
            setApplications(data);
        } catch (err) {
            console.error('Failed to fetch recent applications:', err);
            setError('Failed to load recent applications.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleRowClick = (id: string) => {
        router.push(`/applications/${id}`);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Recent Applications</span>
                <Link
                    href="/applications"
                    className="text-sm text-primary hover:underline transition-colors"
                >
                    View all
                </Link>
            </div>

            {loading && (
                <div className="rounded-lg border">
                    <div className="border-b px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-b last:border-b-0 px-4 py-3">
                            <Skeleton className="h-5 w-full" />
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center rounded-lg border">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={fetchApplications}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            )}

            {!loading && !error && applications.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center rounded-lg border">
                    <p className="text-sm text-muted-foreground">No applications yet</p>
                    <p className="text-xs text-muted-foreground">
                        Add your first application to track your job search
                    </p>
                </div>
            )}

            {!loading && !error && applications.length > 0 && (
                <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Company</TableHead>
                                <TableHead className="hidden sm:table-cell">Position</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Location</TableHead>
                                <TableHead className="hidden lg:table-cell">Applied</TableHead>
                                <TableHead className="hidden lg:table-cell">Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map((app) => (
                                <TableRow
                                    key={app.id}
                                    onClick={() => handleRowClick(app.id)}
                                    className="cursor-pointer"
                                >
                                    <TableCell className="font-medium">
                                        <div>{app.company?.name || 'Unknown'}</div>
                                        <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                                            {app.job?.title || 'Unknown'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {app.job?.title || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(app.status?.name || '')}>
                                            {app.status?.name || 'Unknown'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground">
                                        {app.job?.location || '—'}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                                        {formatAppliedDate(app.applied_at)}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                                        {formatJobType(app.job?.job_type)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                </Table>
            )}
        </div>
    );
}
