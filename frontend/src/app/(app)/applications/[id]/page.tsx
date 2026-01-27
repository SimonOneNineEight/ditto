'use client';

import { useState } from 'react';
import {
    ChartNoAxesColumn,
    Link as LinkIcon,
    MapPin,
    Tags,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import JobDescription from './job-description';
import { DocumentsSection } from '@/components/file-upload';
import { useParams } from 'next/navigation';
import { InterviewFormModal } from '@/components/interview-form/interview-form-modal';
import { Button } from '@/components/ui/button';

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
        render: data.application.tags.map((tag, index) => (
            <Badge key={index} variant="outline">{`#${tag}`}</Badge>
        )),
    },
];

const ApplicationPage = () => {
    const params = useParams();
    const applicationId = params.id as string;
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

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
                <DocumentsSection applicationId={applicationId} />
                <JobDescription
                    jobDescription={data.application.jobDescription}
                />
            </section>
            <section>
                <Button onClick={() => setIsInterviewModalOpen(true)}>
                    Add Interview
                </Button>
            </section>
            <InterviewFormModal
                applicationId={applicationId}
                open={isInterviewModalOpen}
                onOpenChange={setIsInterviewModalOpen}
            />
        </div>
    );
};

export default ApplicationPage;
