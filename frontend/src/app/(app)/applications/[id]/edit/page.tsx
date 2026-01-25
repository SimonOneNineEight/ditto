'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import ApplicationForm from '../../new/add-application-form';
import {
    getApplication,
    type ApplicationWithDetails,
} from '@/services/application-service';
import { Loader2 } from 'lucide-react';

const EditApplicationPage = () => {
    const params = useParams();
    const applicationId = params.id as string;

    const [application, setApplication] = useState<ApplicationWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                const data = await getApplication(applicationId);
                setApplication(data);
            } catch {
                setError('Failed to load application');
            } finally {
                setLoading(false);
            }
        };

        fetchApplication();
    }, [applicationId]);

    if (loading) {
        return (
            <div className="w-full max-w-[720px] mx-auto flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !application) {
        return (
            <div className="w-full max-w-[720px] mx-auto">
                <PageHeader
                    title="Edit Application"
                    breadcrumbs={[
                        { label: 'Applications', href: '/applications' },
                    ]}
                />
                <p className="text-destructive">{error || 'Application not found'}</p>
            </div>
        );
    }

    const initialData = {
        company: application.company
            ? { id: application.company.id, name: application.company.name }
            : { name: '' },
        position: application.job?.title || '',
        location: application.job?.location || '',
        jobType: application.job?.job_type as
            | 'full-time'
            | 'part-time'
            | 'contract'
            | 'internship'
            | undefined,
        description: application.job?.description || '',
        sourceUrl: application.job?.source_url || '',
        notes: application.notes || '',
    };

    return (
        <div className="w-full max-w-[720px] mx-auto">
            <PageHeader
                title="Edit Application"
                breadcrumbs={[{ label: 'Applications', href: '/applications' }]}
            />
            <ApplicationForm
                mode="edit"
                applicationId={applicationId}
                initialData={initialData}
            />
        </div>
    );
};

export default EditApplicationPage;
