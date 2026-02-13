'use client';

import { format, parseISO } from 'date-fns';
import { InterviewDetailCard } from './interview-detail-card';
import { Interview } from '@/services/interview-service';

interface DetailsCardProps {
    interview: Interview;
}

const formatDate = (dateStr: string) => {
    try {
        return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
        return dateStr;
    }
};

const formatTime = (timeStr?: string) => {
    if (!timeStr) return '—';
    try {
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return format(date, 'h:mm a');
    } catch {
        return timeStr;
    }
};

const getInterviewTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
        phone_screen: 'Phone Screen',
        technical: 'Technical',
        behavioral: 'Behavioral',
        panel: 'Panel',
        onsite: 'Onsite',
        other: 'Other',
    };
    return labels[type] || type;
};

export const DetailsCard = ({ interview }: DetailsCardProps) => {
    return (
        <InterviewDetailCard title="Interview Details">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        Date
                    </div>
                    <div className="text-sm">
                        {formatDate(interview.scheduled_date)}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        Time
                    </div>
                    <div className="text-sm">
                        {formatTime(interview.scheduled_time)}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        Duration
                    </div>
                    <div className="text-sm">
                        {interview.duration_minutes
                            ? `${interview.duration_minutes} min`
                            : '—'}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        Type
                    </div>
                    <div className="text-sm">
                        {getInterviewTypeLabel(interview.interview_type)}
                    </div>
                </div>
            </div>
        </InterviewDetailCard>
    );
};
