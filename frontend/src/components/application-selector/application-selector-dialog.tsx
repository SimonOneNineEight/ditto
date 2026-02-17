'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Briefcase, Building2 } from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    getApplications,
    type ApplicationWithDetails,
} from '@/services/application-service';

interface ApplicationSelectorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (applicationId: string) => void;
}

export const ApplicationSelectorDialog = ({
    open,
    onOpenChange,
    onSelect,
}: ApplicationSelectorDialogProps) => {
    const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (open) {
            fetchApplications();
        }
    }, [open]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getApplications({ limit: 1000 });
            setApplications(response.applications || []);
        } catch {
            setError('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const filteredApplications = useMemo(() => {
        if (!searchQuery.trim()) return applications;

        const query = searchQuery.toLowerCase();
        return applications.filter((app) => {
            const companyName = app.company?.name?.toLowerCase() || '';
            const jobTitle = app.job?.title?.toLowerCase() || '';
            return companyName.includes(query) || jobTitle.includes(query);
        });
    }, [applications, searchQuery]);

    const handleSelect = (applicationId: string) => {
        setSearchQuery('');
        onSelect(applicationId);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setSearchQuery('');
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Application</DialogTitle>
                    <DialogDescription>
                        Choose an application to add an interview to
                    </DialogDescription>
                </DialogHeader>

                <DialogBody>
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-14 w-full" />
                            <Skeleton className="h-14 w-full" />
                            <Skeleton className="h-14 w-full" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                            <p className="text-sm text-muted-foreground">{error}</p>
                            <Button variant="outline" size="sm" onClick={fetchApplications}>
                                Try Again
                            </Button>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                                <Briefcase className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium">No applications yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Create an application first to schedule an interview
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search applications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1">
                                {filteredApplications.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No applications match your search
                                    </p>
                                ) : (
                                    filteredApplications.map((app) => (
                                        <button
                                            key={app.id}
                                            onClick={() => handleSelect(app.id)}
                                            className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-muted text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                        >
                                            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-muted flex-shrink-0">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {app.job?.title || 'Untitled Position'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {app.company?.name || 'Unknown Company'}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </DialogBody>
            </DialogContent>
        </Dialog>
    );
};
