import api from '@/lib/axios';

export interface CreateInterviewRequest {
    application_id: string;
    interview_type:
        | 'phone_screen'
        | 'technical'
        | 'behavioral'
        | 'panel'
        | 'onsite'
        | 'other';
    scheduled_date: string;
    scheduled_time?: string;
    duration_minutes?: number;
}

export interface Interview {
    id: string;
    application_id: string;
    round_number: number;
    interview_type: string;
    scheduled_date: string;
    scheduled_time?: string;
    duration_minutes?: number;
    created_at: string;
    updated_at: string;
}

export const createInterview = async (
    data: CreateInterviewRequest
): Promise<Interview> => {
    const response = await api.post('/api/interviews', data);
    return response.data.data.interview;
};
