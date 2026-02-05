'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ASSESSMENT_STATUS_OPTIONS,
    getAssessmentStatusLabel,
    type AssessmentStatus,
} from '@/services/assessment-service';

const STATUS_PILL_COLORS: Record<AssessmentStatus, { bg: string; text: string }> = {
    not_started: { bg: 'hsl(var(--muted))', text: '#ffffff' },
    in_progress: { bg: '#1e4a7a', text: '#ffffff' },
    submitted: { bg: '#5a4a1a', text: '#ffffff' },
    passed: { bg: '#1a5a3d', text: '#ffffff' },
    failed: { bg: '#5c2a2a', text: '#ffffff' },
};

interface AssessmentStatusSelectProps {
    value: AssessmentStatus;
    onChange: (status: AssessmentStatus) => void;
    onSubmittedSelect?: () => void;
    disabled?: boolean;
    variant?: 'default' | 'badge';
}

export const AssessmentStatusSelect = ({
    value,
    onChange,
    onSubmittedSelect,
    disabled = false,
    variant = 'default',
}: AssessmentStatusSelectProps) => {
    const handleValueChange = (newValue: string) => {
        const status = newValue as AssessmentStatus;
        onChange(status);

        if (status === 'submitted' && onSubmittedSelect) {
            onSubmittedSelect();
        }
    };

    const statusColors = STATUS_PILL_COLORS[value] || STATUS_PILL_COLORS.not_started;

    return (
        <Select
            value={value}
            onValueChange={handleValueChange}
            disabled={disabled}
        >
            <SelectTrigger
                variant={variant}
                className={variant === 'default' ? 'w-[180px]' : undefined}
                style={variant === 'badge' ? {
                    backgroundColor: statusColors.bg,
                    color: statusColors.text,
                } : undefined}
            >
                <SelectValue>
                    {getAssessmentStatusLabel(value)}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {ASSESSMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
