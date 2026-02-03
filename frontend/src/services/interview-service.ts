import api from '@/lib/axios';

export type InterviewType =
    | 'phone_screen'
    | 'technical'
    | 'behavioral'
    | 'panel'
    | 'onsite'
    | 'other';

export type NoteType =
    | 'preparation'
    | 'company_research'
    | 'feedback'
    | 'reflection'
    | 'general';

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

// Short labels for compact displays (tables, badges)
const SHORT_LABELS: Record<string, string> = {
    phone_screen: 'Phone',
};

export const getInterviewTypeShortLabel = (value: string): string => {
    return SHORT_LABELS[value] || getInterviewTypeLabel(value);
};

export interface CreateInterviewRequest {
    application_id: string;
    interview_type: InterviewType;
    scheduled_date: string;
    scheduled_time?: string;
    duration_minutes?: number;
}

export type OverallFeeling = 'excellent' | 'good' | 'okay' | 'poor';

export interface UpdateInterviewRequest {
    scheduled_date?: string;
    scheduled_time?: string;
    duration_minutes?: number;
    interview_type?: InterviewType;
    outcome?: string;
    overall_feeling?: OverallFeeling;
    went_well?: string;
    could_improve?: string;
    confidence_level?: number;
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
    updated_at: string;
}

export interface CreateInterviewerRequest {
    name: string;
    role?: string;
}

export interface UpdateInterviewerRequest {
    name?: string;
    role?: string;
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

export interface InterviewerSummary {
    name: string;
    role?: string;
}

export interface RoundSummary {
    id: string;
    round_number: number;
    interview_type: string;
    scheduled_date: string;
    interviewers: InterviewerSummary[];
    questions_preview: string;
    feedback_preview: string;
}

export interface InterviewWithContext {
    current_interview: InterviewWithDetails;
    all_rounds: RoundSummary[];
    application: ApplicationInfo;
}

export interface InterviewListItem extends Interview {
    company_name: string;
    job_title: string;
}

export interface CreateOrUpdateNoteRequest {
    note_type: NoteType;
    content: string;
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

export const getInterviewWithContext = async (
    id: string
): Promise<InterviewWithContext> => {
    const response = await api.get(`/api/interviews/${id}/with-context`);
    const data = response.data.data;
    return {
        current_interview: {
            interview: data.current_interview.interview,
            application: data.current_interview.application,
            interviewers: data.current_interview.interviewers || [],
            questions: data.current_interview.questions || [],
            notes: data.current_interview.notes || [],
        },
        all_rounds: data.all_rounds || [],
        application: data.application,
    };
};

export const updateInterview = async (
    id: string,
    data: UpdateInterviewRequest
): Promise<Interview> => {
    const response = await api.put(`/api/interviews/${id}`, data);
    return response.data.data.interview;
};

export type InterviewFilter = 'all' | 'upcoming' | 'past';

export interface ListInterviewsOptions {
    filter?: InterviewFilter;
    upcoming?: boolean;
    range?: 'today' | 'week' | 'month' | 'all';
    page?: number;
    limit?: number;
}

export interface InterviewListResponse {
    interviews: InterviewListItem[];
    meta?: {
        page: number;
        limit: number;
        total_items: number;
        total_pages: number;
    };
}

export const listInterviews = async (
    options?: ListInterviewsOptions
): Promise<InterviewListResponse> => {
    const params = new URLSearchParams();

    if (options?.filter) {
        params.append('filter', options.filter);
    }
    if (options?.upcoming) {
        params.append('upcoming', 'true');
    }
    if (options?.range && options.range !== 'all') {
        params.append('range', options.range);
    }
    if (options?.page) {
        params.append('page', options.page.toString());
    }
    if (options?.limit) {
        params.append('limit', options.limit.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/api/interviews?${queryString}` : '/api/interviews';

    const response = await api.get(url);
    return {
        interviews: response.data.data.interviews || [],
        meta: response.data.data.meta,
    };
};

// Interviewer CRUD operations
export const createInterviewer = async (
    interviewId: string,
    data: CreateInterviewerRequest
): Promise<Interviewer> => {
    const response = await api.post(
        `/api/interviews/${interviewId}/interviewers`,
        data
    );
    return response.data.data.interviewer;
};

export const createInterviewers = async (
    interviewId: string,
    interviewers: CreateInterviewerRequest[]
): Promise<Interviewer[]> => {
    const response = await api.post(
        `/api/interviews/${interviewId}/interviewers`,
        { interviewers }
    );
    return response.data.data.interviewers;
};

export const updateInterviewer = async (
    interviewerId: string,
    data: UpdateInterviewerRequest
): Promise<Interviewer> => {
    const response = await api.put(`/api/interviewers/${interviewerId}`, data);
    return response.data.data.interviewer;
};

export const deleteInterviewer = async (
    interviewerId: string
): Promise<void> => {
    await api.delete(`/api/interviewers/${interviewerId}`);
};

// Question CRUD operations
export interface CreateQuestionRequest {
    question_text: string;
    answer_text?: string;
}

export interface UpdateQuestionRequest {
    question_text?: string;
    answer_text?: string;
}

export const createQuestion = async (
    interviewId: string,
    data: CreateQuestionRequest
): Promise<InterviewQuestion> => {
    const response = await api.post(
        `/api/interviews/${interviewId}/questions`,
        data
    );
    return response.data.data.question;
};

export const createQuestions = async (
    interviewId: string,
    questions: CreateQuestionRequest[]
): Promise<InterviewQuestion[]> => {
    const response = await api.post(
        `/api/interviews/${interviewId}/questions`,
        { questions }
    );
    return response.data.data.questions;
};

export const updateQuestion = async (
    questionId: string,
    data: UpdateQuestionRequest
): Promise<InterviewQuestion> => {
    const response = await api.put(
        `/api/interview-questions/${questionId}`,
        data
    );
    return response.data.data.question;
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
    await api.delete(`/api/interview-questions/${questionId}`);
};

export const reorderQuestions = async (
    interviewId: string,
    questionIds: string[]
): Promise<InterviewQuestion[]> => {
    const response = await api.patch(
        `/api/interviews/${interviewId}/questions/reorder`,
        { question_ids: questionIds }
    );
    return response.data.data.questions;
};

export const createOrUpdateNote = async (
    interviewId: string,
    data: CreateOrUpdateNoteRequest
): Promise<InterviewNote> => {
    const response = await api.post(
        `/api/interviews/${interviewId}/notes`,
        data
    );
    return response.data.data.interviewNote;
};

export const deleteInterview = async (id: string): Promise<void> => {
    await api.delete(`/api/interviews/${id}`);
};
