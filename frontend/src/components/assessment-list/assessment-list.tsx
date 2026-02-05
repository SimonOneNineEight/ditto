'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus } from 'lucide-react';
import { differenceInDays, parseISO, isPast, isToday, format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AssessmentStatusSelect } from '@/components/assessment-status-select';
import {
    Assessment,
    getAssessmentTypeLabel,
    TYPE_COLORS,
    updateAssessmentStatus,
    type AssessmentType,
    type AssessmentStatus,
} from '@/services/assessment-service';

interface CountdownInfo {
    text: string;
    color: string;
}

const COMPLETED_STATUSES = ['submitted', 'passed', 'failed'];

export function getCountdownInfo(dueDateStr: string, status?: string): CountdownInfo {
    if (status && COMPLETED_STATUSES.includes(status)) {
        return {
            text: 'Completed',
            color: '#22c55e',
        };
    }

    const dueDate = parseISO(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = differenceInDays(dueDate, today);

    if (isPast(dueDate) && !isToday(dueDate)) {
        const overdueDays = Math.abs(days);
        return {
            text: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
            color: '#ef4444',
        };
    }

    if (isToday(dueDate)) {
        return {
            text: 'Due today',
            color: '#ef4444',
        };
    }

    if (days === 1) {
        return {
            text: 'Due tomorrow',
            color: '#f59e0b',
        };
    }

    if (days <= 3) {
        return {
            text: `${days} days left`,
            color: '#f59e0b',
        };
    }

    return {
        text: `${days} days left`,
        color: '#22c55e',
    };
}

interface AssessmentListProps {
    assessments: Assessment[];
    applicationId: string;
    onAddClick: () => void;
    onStatusUpdate?: (assessmentId: string, newStatus: AssessmentStatus) => void;
}

export const AssessmentList = ({
    assessments,
    applicationId,
    onAddClick,
    onStatusUpdate,
}: AssessmentListProps) => {
    const router = useRouter();
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [localStatuses, setLocalStatuses] = useState<Record<string, AssessmentStatus>>({});

    const handleCardClick = (assessmentId: string) => {
        router.push(`/applications/${applicationId}/assessments/${assessmentId}`);
    };

    const handleStatusChange = async (
        assessmentId: string,
        newStatus: AssessmentStatus,
        currentStatus: AssessmentStatus
    ) => {
        setLocalStatuses((prev) => ({ ...prev, [assessmentId]: newStatus }));
        setUpdatingId(assessmentId);

        try {
            await updateAssessmentStatus(assessmentId, newStatus);
            onStatusUpdate?.(assessmentId, newStatus);
        } catch {
            setLocalStatuses((prev) => ({ ...prev, [assessmentId]: currentStatus }));
            toast.error('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    if (assessments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                    No assessments yet
                </p>
                <Button size="sm" onClick={onAddClick}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Assessment
                </Button>
            </div>
        );
    }

    const sortedAssessments = [...assessments].sort(
        (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

    return (
        <div className="flex flex-col gap-3">
            {sortedAssessments.map((assessment) => {
                const displayStatus = localStatuses[assessment.id] ?? assessment.status;
                const countdown = getCountdownInfo(assessment.due_date, displayStatus);
                const typeColor = TYPE_COLORS[assessment.assessment_type as AssessmentType] || TYPE_COLORS.other;
                const formattedDate = format(parseISO(assessment.due_date), 'MMM d');

                return (
                    <Card
                        key={assessment.id}
                        variant="inset"
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleCardClick(assessment.id)}
                    >
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-2.5">
                                {/* Row 1: Title */}
                                <h4 className="text-sm font-medium truncate">
                                    {assessment.title}
                                </h4>

                                {/* Row 2: Meta info + Status */}
                                <div className="flex items-center justify-between gap-3">
                                    {/* Left: Type badge, date, countdown */}
                                    <div className="flex items-center gap-2 text-xs min-w-0">
                                        <span
                                            className={`inline-flex items-center shrink-0 px-2 py-0.5 rounded-full font-medium border ${typeColor}`}
                                        >
                                            {getAssessmentTypeLabel(assessment.assessment_type)}
                                        </span>
                                        <span className="text-muted-foreground">·</span>
                                        <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">{formattedDate}</span>
                                        <span className="text-muted-foreground">·</span>
                                        <span
                                            className="font-medium shrink-0"
                                            style={{ color: countdown.color }}
                                        >
                                            {countdown.text}
                                        </span>
                                    </div>

                                    {/* Right: Status dropdown */}
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <AssessmentStatusSelect
                                            value={displayStatus}
                                            onChange={(newStatus) =>
                                                handleStatusChange(
                                                    assessment.id,
                                                    newStatus,
                                                    assessment.status
                                                )
                                            }
                                            disabled={updatingId === assessment.id}
                                            variant="badge"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};
