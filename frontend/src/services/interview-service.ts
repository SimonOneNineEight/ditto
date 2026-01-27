import api from '@/lib/axios';

export type InterviewType =
    | 'phone_screen'
    | 'technical'
    | 'behavioral'
    | 'panel'
    | 'onsite'
    | 'other';

export const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
    { value: 'phone_screen', label: 'Phone Screen' },
    { value: 'technical', label: 'Technical' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'panel', label: 'Panel' },
    { value: 'onsite', label: 'Onsite' },
    { value: 'other', label: 'Other' },
];

export const getInterviewTypeLabel = (value: string): string => {
    return INTERVIEW_TYPES.find((t) => t.value === value)?.label || value;
};

export interface CreateInterviewRequest {
    application_id: string;
    interview_type: InterviewType;
    scheduled_date: string;
    scheduled_time?: string;
    duration_minutes?: number;
}

export interface UpdateInterviewRequest {
    scheduled_date?: string;
    scheduled_time?: string;
    duration_minutes?: number;
    interview_type?: InterviewType;
    outcome?: string;
}

export interface Interview {
    id: string;
    application_id: string;
    round_number: number;
    interview_type: string;
    scheduled_date: string;
    scheduled_time?: string;
    duration_minutes?: number;
    outcome?: string;
    overall_feeling?: string;
    went_well?: string;
    could_improve?: string;
    confidence_level?: number;
    created_at: string;
    updated_at: string;
}

export interface ApplicationInfo {
    company_name: string;
    job_title: string;
}

export interface InterviewWithApplication {
    interview: Interview;
    application: ApplicationInfo;
}

export interface Interviewer {
    id: string;
    interview_id: string;
    name: string;
    role?: string;
    created_at: string;
}

export interface InterviewQuestion {
    id: string;
    interview_id: string;
    question_text: string;
    answer_text?: string;
    order: number;
    created_at: string;
    updated_at: string;
}

export interface InterviewNote {
    id: string;
    interview_id: string;
    note_type: string;
    content?: string;
    created_at: string;
    updated_at: string;
}

export interface InterviewWithDetails extends InterviewWithApplication {
    interviewers: Interviewer[];
    questions: InterviewQuestion[];
    notes: InterviewNote[];
}

export interface InterviewListItem extends Interview {
    company_name: string;
    job_title: string;
}

export const createInterview = async (
    data: CreateInterviewRequest
): Promise<Interview> => {
    const response = await api.post('/api/interviews', data);
    return response.data.data.interview;
};

export const getInterviewById = async (
    id: string
): Promise<InterviewWithApplication> => {
    const response = await api.get(`/api/interviews/${id}`);
    return {
        interview: response.data.data.interview,
        application: response.data.data.application,
    };
};

export const getInterviewWithDetails = async (
    id: string
): Promise<InterviewWithDetails> => {
    const response = await api.get(`/api/interviews/${id}/details`);
    return {
        interview: response.data.data.interview,
        application: response.data.data.application,
        interviewers: response.data.data.interviewers || [],
        questions: response.data.data.questions || [],
        notes: response.data.data.notes || [],
    };
};

export const updateInterview = async (
    id: string,
    data: UpdateInterviewRequest
): Promise<Interview> => {
    const response = await api.put(`/api/interviews/${id}`, data);
    return response.data.data.interview;
};

export const listInterviews = async (): Promise<InterviewListItem[]> => {
    const response = await api.get('/api/interviews');
    return response.data.data.interviews || [];
};
