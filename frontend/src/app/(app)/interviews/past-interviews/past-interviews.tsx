import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import React from 'react';
import { PastInterviewRow } from './interview-row';
import { columns } from './interview-row-column';

const interviews = [
    {
        company: 'Google',
        position: 'Software Engineer',
        applyDates: [
            {
                date: '2025-02-22',
                applicationId: '1',
                interviews: [
                    {
                        id: '1',
                        stage: 'First Round',
                        tags: ['Important!'],
                        interviewDate: '2025-06-19',
                        interviewerName:
                            'Cool man hd aaaaaaaaaaaaaaaaaadddadfsadfdsfadsfds:width: , ',
                        interviewerUrl: 'www.simon198.com',
                        notes: 'note.md',
                    },

                    {
                        id: '2',
                        stage: 'Technical',
                        tags: ['Important!', 'Technical'],
                        interviewDate: '2025-06-22',
                        interviewerName: 'Tech Lead',
                        interviewerUrl: 'www.simon198.com',
                        notes: 'note.md',
                    },
                ],
            },
        ],
    },
];

const PastInterviews = () => {
    return (
        <div className="w-full min-w-0">
            {interviews.map((position) => (
                <Accordion
                    key={`${position.company}-${position.position}`}
                    type="multiple"
                    defaultValue={interviews.map(
                        (pos) => `${pos.company}-${pos.position}`
                    )}
                >
                    <AccordionItem
                        value={`${position.company}-${position.position}`}
                    >
                        <AccordionTrigger className="pb-2">
                            <h4>
                                {`${position.company} - ${position.position}`}
                            </h4>
                        </AccordionTrigger>
                        <AccordionContent>
                            {position.applyDates.map(
                                ({ date, applicationId, interviews }) => (
                                    <Accordion
                                        key="date"
                                        type="multiple"
                                        defaultValue={interviews.map(
                                            () =>
                                                `${position.company}-${position.position}-${date}`
                                        )}
                                    >
                                        <AccordionItem
                                            value={`${position.company}-${position.position}-${date}`}
                                        >
                                            <AccordionTrigger className="pt-2">
                                                <h5>{`Applied Date: ${date}`}</h5>
                                            </AccordionTrigger>

                                            <AccordionContent className="w-full min-w-0 ">
                                                <PastInterviewRow
                                                    columns={columns}
                                                    data={interviews}
                                                    applicationId={
                                                        applicationId
                                                    }
                                                />
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                )
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            ))}
        </div>
    );
};

export default PastInterviews;
