import React from 'react';
import { ApplicationTable } from './ApplicationTable';
import { Application, columns } from './ApplicationTable/columns';

type Props = {};

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

const ApplicationPage = (props: Props) => {
    return (
        <>
            <ApplicationTable columns={columns} data={data} />
        </>
    );
};

export default ApplicationPage;
