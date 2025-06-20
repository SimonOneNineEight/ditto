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
        <div className="w-full p-6 flex flex-col">
            <div className="mb-6">
                <h1 className="pb-2">Applications</h1>
                <h5>Some Motivating sentence to help people keep going</h5>
            </div>
            <ApplicationTable columns={columns} data={data} />
        </div>
    );
};

export default ApplicationPage;
