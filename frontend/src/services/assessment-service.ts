import api from '@/lib/axios';

export type AssessmentType =
    | 'take_home_project'
    | 'live_coding'
    | 'system_design'
    | 'data_structures'
    | 'case_study'
    | 'other';

export type AssessmentStatus =
    | 'not_started'
    | 'in_progress'
    | 'submitted'
    | 'passed'
    | 'failed';

export type SubmissionType = 'github' | 'file_upload' | 'notes';

export const ASSESSMENT_TYPE_OPTIONS: { value: AssessmentType; label: string }[] = [
    { value: 'take_home_project', label: 'Take Home Project' },
    { value: 'live_coding', label: 'Live Coding' },
    { value: 'system_design', label: 'System Design' },
    { value: 'data_structures', label: 'Data Structures' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'other', label: 'Other' },
];

export const ASSESSMENT_STATUS_OPTIONS: { value: AssessmentStatus; label: string }[] = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'passed', label: 'Passed' },
    { value: 'failed', label: 'Failed' },
];

export const SUBMISSION_TYPE_OPTIONS: {
    value: SubmissionType;
    label: string;
}[] = [
    { value: 'github', label: 'GitHub' },
    { value: 'file_upload', label: 'File Upload' },
    { value: 'notes', label: 'Notes' },
];

export const getAssessmentTypeLabel = (value: string): string => {
    return ASSESSMENT_TYPE_OPTIONS.find((t) => t.value === value)?.label || value;
};

export const getAssessmentStatusLabel = (value: string): string => {
    return ASSESSMENT_STATUS_OPTIONS.find((s) => s.value === value)?.label || value;
};

export const STATUS_COLORS: Record<AssessmentStatus, string> = {
    not_started: 'bg-muted text-muted-foreground',
    in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    submitted: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    passed: 'bg-green-500/15 text-green-400 border-green-500/20',
    failed: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export const TYPE_COLORS: Record<AssessmentType, string> = {
    take_home_project: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    live_coding: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    system_design: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    data_structures: 'bg-green-500/15 text-green-400 border-green-500/20',
    case_study: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    other: 'bg-muted text-muted-foreground',
};

export interface Assessment {
    id: string;
    user_id: string;
    application_id: string;
    assessment_type: AssessmentType;
    title: string;
    due_date: string;
    status: AssessmentStatus;
    instructions?: string;
    requirements?: string;
    created_at: string;
    updated_at: string;
}

export interface AssessmentSubmission {
    id: string;
    assessment_id: string;
    submission_type: SubmissionType;
    github_url?: string;
    file_id?: string;
    notes?: string;
    submitted_at: string;
    created_at: string;
}

export interface CreateAssessmentRequest {
    application_id: string;
    assessment_type: AssessmentType;
    title: string;
    due_date: string;
    instructions?: string;
    requirements?: string;
}

export interface UpdateAssessmentRequest {
    title?: string;
    assessment_type?: AssessmentType;
    due_date?: string;
    status?: AssessmentStatus;
    instructions?: string;
    requirements?: string;
}

export interface CreateSubmissionRequest {
    submission_type: SubmissionType;
    github_url?: string;
    file_id?: string;
    notes?: string;
}

export interface AssessmentWithSubmissions {
    assessment: Assessment;
    submissions: AssessmentSubmission[];
}

// Assessment with application context for dashboard/timeline display
export interface AssessmentWithContext extends Assessment {
    company_name: string;
    job_title: string;
}

export const createAssessment = async (
    data: CreateAssessmentRequest
): Promise<Assessment> => {
    const response = await api.post('/api/assessments', data);
    return response.data.data.assessment;
};

export const getAssessment = async (id: string): Promise<Assessment> => {
    const response = await api.get(`/api/assessments/${id}`);
    return response.data.data.assessment;
};

export const listAssessments = async (
    applicationId: string
): Promise<Assessment[]> => {
    const response = await api.get(
        `/api/assessments?application_id=${applicationId}`
    );
    return response.data.data.assessments || [];
};

export const listAllAssessments = async (): Promise<AssessmentWithContext[]> => {
    const response = await api.get('/api/assessments');
    return response.data.data.assessments || [];
};

export const updateAssessment = async (
    id: string,
    data: UpdateAssessmentRequest
): Promise<Assessment> => {
    const response = await api.put(`/api/assessments/${id}`, data);
    return response.data.data.assessment;
};

export const updateAssessmentStatus = async (
    id: string,
    status: AssessmentStatus
): Promise<Assessment> => {
    const response = await api.patch(`/api/assessments/${id}/status`, {
        status,
    });
    return response.data.data.assessment;
};

export const deleteAssessment = async (id: string): Promise<void> => {
    await api.delete(`/api/assessments/${id}`);
};

export const createSubmission = async (
    assessmentId: string,
    data: CreateSubmissionRequest
): Promise<AssessmentSubmission> => {
    const response = await api.post(
        `/api/assessments/${assessmentId}/submissions`,
        data
    );
    return response.data.data.submission;
};

export const getAssessmentDetails = async (
    id: string
): Promise<AssessmentWithSubmissions> => {
    const response = await api.get(`/api/assessments/${id}/details`);
    return {
        assessment: response.data.data.assessment,
        submissions: response.data.data.submissions || [],
    };
};
