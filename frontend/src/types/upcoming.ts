export type UrgencyLevel = 'overdue' | 'today' | 'upcoming' | 'scheduled';

export interface CountdownInfo {
    text: string;
    urgency: UrgencyLevel;
    days_until: number;
}

export interface UpcomingItem {
    id: string;
    type: 'interview' | 'assessment';
    title: string;
    company_name: string;
    job_title: string;
    due_date: string;
    application_id: string;
    countdown: CountdownInfo;
    link: string;
}

export type UpcomingFilterType = 'all' | 'interviews' | 'assessments';
