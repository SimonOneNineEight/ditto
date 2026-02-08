export type NotificationType = 'interview_reminder' | 'assessment_deadline' | 'system_alert';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
}

export interface NotificationPreferences {
    user_id: string;
    interview_24h: boolean;
    interview_1h: boolean;
    assessment_3d: boolean;
    assessment_1d: boolean;
    assessment_1h: boolean;
    created_at: string;
    updated_at: string;
}

export interface UpdateNotificationPreferencesRequest {
    interview_24h: boolean;
    interview_1h: boolean;
    assessment_3d: boolean;
    assessment_1d: boolean;
    assessment_1h: boolean;
}
