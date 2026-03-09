'use client';

import { format, parseISO, isPast, isToday, startOfDay } from 'date-fns';
import { InterviewDetailCard } from './interview-detail-card';
import { Badge } from '@/components/ui/badge';
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

function getStatusVariant(interview: Interview): 'scheduled' | 'completed' | 'cancelled' | 'awaiting_outcome' {
    if (interview.status === 'cancelled') return 'cancelled';
    if (interview.status === 'completed' || interview.outcome) return 'completed';

    const interviewDate = startOfDay(parseISO(interview.scheduled_date));
    const today = startOfDay(new Date());
    if (isPast(interviewDate) && !isToday(interviewDate)) return 'awaiting_outcome';

    return 'scheduled';
}

function getStatusLabel(interview: Interview): string {
    if (interview.status === 'cancelled') return 'Cancelled';
    if (interview.outcome) return interview.outcome.charAt(0).toUpperCase() + interview.outcome.slice(1);
    if (interview.status === 'completed') return 'Completed';

    const interviewDate = startOfDay(parseISO(interview.scheduled_date));
    const today = startOfDay(new Date());
    if (isPast(interviewDate) && !isToday(interviewDate)) return 'Awaiting Outcome';

    return 'Scheduled';
}

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
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        Status
                    </div>
                    <div className="text-sm">
                        <Badge variant={getStatusVariant(interview)}>
                            {getStatusLabel(interview)}
                        </Badge>
                    </div>
                </div>
            </div>
        </InterviewDetailCard>
    );
};
