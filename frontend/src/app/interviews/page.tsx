import React from 'react';
import { InterivewTable } from './InterviewTable/InterviewTable';
import { Interview, columns } from './InterviewTable/columns';
import PastInterviews from './PastInterviews';

type Props = {};

const data: Interview[] = [
    {
        id: '1',
        company: 'Google',
        position: 'Software Engineer',
        stage: 'First Round',
        tags: ['Important!', 'Technical'],
        interviewDate: '2025-06-19',
        interviewerName: 'Cool man',
        interviewerUrl: 'www.simon198.com',
        notes: 'note.md',
    },
];

const InterviewPage = (props: Props) => {
    return (
        <div className="w-full max-w-full p-6 flex flex-col gap-6 min-w-0">
            <div>
                <h1 className="pb-2">Interviews</h1>
                <h5>Some Motivating sentence to help people keep going</h5>
            </div>
            <section className="min-w-0">
                <h3>Coming</h3>
                <InterivewTable columns={columns} data={data} />
            </section>
            <section>
                <h3>Past</h3>
                <PastInterviews />
            </section>
        </div>
    );
};

export default InterviewPage;
