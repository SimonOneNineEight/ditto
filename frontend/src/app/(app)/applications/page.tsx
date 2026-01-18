import React from 'react';
import { ApplicationTable } from './application-table';
import { Application, columns } from './application-table/columns';
import { PageHeader } from '@/components/page-header';

const data: Application[] = [
    {
        id: '1',
        company: 'Google',
        position: 'Software Engineer',
        status: 'Applied',
        location: 'San Jose',
        tags: ['software', 'remote'],
        applyDate: '2025-02-72',
    },
    {
        id: '2',
        company: 'Tesla',
        position: 'Software Engineer',
        status: 'Offered',
        location: 'San Jose',
        tags: [],
        applyDate: '2025-02-72',
    },
];

const ApplicationPage = () => {
    return (
        <>
            <PageHeader
                title="Applications"
                subtitle="Track and manage your job applications"
            />
            <ApplicationTable columns={columns} data={data} />
        </>
    );
};

export default ApplicationPage;
