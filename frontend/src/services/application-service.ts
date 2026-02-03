import api from '@/lib/axios';

// Types matching backend models

export interface ApplicationStatus {
    id: string;
    name: string;
}

export interface Company {
    id: string;
    name: string;
    logo_url?: string;
}

export interface Job {
    id: string;
    title: string;
    description?: string;
    location?: string;
    job_type?: string;
    source_url?: string;
}

export interface ApplicationWithDetails {
    id: string;
    user_id: string;
    job_id: string;
    application_status_id: string;
    applied_at: string;
    offer_received: boolean;
    attempt_number: number;
    notes?: string;
    resume_file_id?: string;
    cover_letter_file_id?: string;
    created_at: string;
    updated_at: string;
    job?: Job;
    company?: Company;
    status?: ApplicationStatus;
}

export type SortColumn = 'company' | 'position' | 'status' | 'applied_at' | 'location';
export type SortOrder = 'asc' | 'desc';

export interface ApplicationFilters {
    status_id?: string;
    company_name?: string;
    job_title?: string;
    date_from?: string; // YYYY-MM-DD
    date_to?: string;   // YYYY-MM-DD
    sort_by?: SortColumn;
    sort_order?: SortOrder;
    page?: number;
    limit?: number;
}

export interface ApplicationListResponse {
    applications: ApplicationWithDetails[];
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
}

export async function getApplications(filters: ApplicationFilters = {}): Promise<ApplicationListResponse> {
    const params = new URLSearchParams();

    if (filters.status_id) params.set('status_id', filters.status_id);
    if (filters.company_name) params.set('company_name', filters.company_name);
    if (filters.job_title) params.set('job_title', filters.job_title);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    if (filters.sort_by) params.set('sort_by', filters.sort_by);
    if (filters.sort_order) params.set('sort_order', filters.sort_order);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const query = params.toString();
    const url = `/api/applications/with-details${query ? `?${query}` : ''}`;

    const response = await api.get(url);
    return response.data?.data;
}

export async function getApplicationStatuses(): Promise<ApplicationStatus[]> {
    const response = await api.get('/api/application-statuses');
    return response.data?.data?.statuses || [];
}

export async function getApplication(id: string): Promise<ApplicationWithDetails | null> {
    // Use the with-details endpoint since the basic endpoint doesn't include job/company
    const response = await api.get(`/api/applications/with-details?limit=1000`);
    const applications = response.data?.data?.applications || [];
    return applications.find((app: ApplicationWithDetails) => app.id === id) || null;
}

export async function deleteApplication(id: string): Promise<void> {
    await api.delete(`/api/applications/${id}`);
}
