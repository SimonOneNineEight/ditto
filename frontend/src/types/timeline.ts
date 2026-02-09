import type { CountdownInfo, UrgencyLevel } from './upcoming';

export type TimelineFilterType = 'all' | 'interviews' | 'assessments';
export type TimelineRangeFilter = 'today' | 'week' | 'month' | 'all';
export type DateGroup = 'overdue' | 'today' | 'tomorrow' | 'this_week' | 'later';

export interface TimelineItem {
    id: string;
    type: 'interview' | 'assessment';
    title: string;
    company_name: string;
    job_title: string;
    due_date: string;
    application_id: string;
    countdown: CountdownInfo;
    date_group: DateGroup;
    link: string;
}

export interface TimelineFilters {
    type: TimelineFilterType;
    range: TimelineRangeFilter;
    page: number;
    perPage: number;
}

export interface PaginationMeta {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
}

export interface TimelineResponse {
    items: TimelineItem[];
    meta: PaginationMeta;
}

export { type UrgencyLevel };
