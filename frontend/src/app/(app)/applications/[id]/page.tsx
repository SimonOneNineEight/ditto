import React from 'react';
import {
    ChartNoAxesColumn,
    Link as LinkIcon,
    MapPin,
    Tags,
    FileSpreadsheet,
    FileText,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import JobDescription from './jobDescription';

type Props = {};

const data = {
    application: {
        id: '1',
        company: 'Google',
        position: 'Software Engineer Intern',
        url: 'https://www.google.com',
        status: 'Applied',
        location: 'San Jose',
        applyDate: '2025-02-05',
        tags: ['software', 'remoted'],
        resume: 'resume.pdf',
        coverLetter: 'cover_letter.pdf',
        jobDescription:
            'At Cast & Crew, we’ve empowered creativity and supported the global entertainment industry for decades. Together with our family of brands - Backstage, CAPS, Checks & Balances, Final Draft, Media Services, Sargent-Disc, and The TEAM Companies – we operate as a combined entertainment technology and services provider offering industry standard screenwriting accounting software, digital payroll products, data & reporting, and a host of creative tools.  The industry continues to move faster than ever, and the need for our expertise, our technology, and our people has never been greater.  We are a production’s best ally every step of the way. #OneCastOneCrew ',
    },
    interviews: {
        coming: [],
        past: [],
    },
};

const applicationDetail = [
    {
        id: 'status',
        icon: ChartNoAxesColumn,
        label: 'Status',
        render: <Badge>{data.application.status}</Badge>,
    },
    {
        id: 'location',
        icon: MapPin,
        label: 'Location',
        render: <Badge>{data.application.location}</Badge>,
    },
    {
        id: 'tags',
        icon: Tags,
        label: 'Tags',
        render: data.application.tags.map((tag) => (
            <Badge variant="outline">{`#${tag}`}</Badge>
        )),
    },
    {
        id: 'resume',
        icon: FileSpreadsheet,
        label: 'Resume',
        render: <span className="link-subtle">{data.application.resume}</span>,
    },
    {
        id: 'coverLetter',
        icon: FileText,
        label: 'Cover Letter',
        render: (
            <span className="link-subtle">{data.application.coverLetter}</span>
        ),
    },
];

const ApplicationPage = (props: Props) => {
    return (
        <div className="flex flex-col p-4 w-full">
            <section className="flex flex-col gap-12">
                <div>
                    <h2 className="flex gap-2 items-center">
                        <Link href={data.application.url}>
                            {data.application.position}
                        </Link>
                        <LinkIcon />
                    </h2>
                    <div className="flex gap-2">
                        <h4>{data.application.company}</h4>
                        <h4 className="pl-2 border-l-2 border-muted-foreground">{`Apply Date: ${data.application.applyDate}`}</h4>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <h3>Application Detail</h3>
                    {applicationDetail.map(
                        ({ id, icon: Icon, label, render }) => (
                            <div className="flex gap-1 items-center" key={id}>
                                <Icon size={16} />
                                <strong className="w-30">{`${label}:`}</strong>
                                {render}
                            </div>
                        )
                    )}
                </div>
                <JobDescription
                    jobDescription={data.application.jobDescription}
                />
            </section>
        </div>
    );
};

export default ApplicationPage;
