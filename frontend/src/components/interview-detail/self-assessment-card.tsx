'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { InterviewDetailCard } from './interview-detail-card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    Interview,
    updateInterview,
    OverallFeeling,
} from '@/services/interview-service';

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const OVERALL_FEELINGS: { value: OverallFeeling; label: string }[] = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'okay', label: 'Okay' },
    { value: 'poor', label: 'Poor' },
];

const CONFIDENCE_LEVELS = [1, 2, 3, 4, 5] as const;

const getConfidenceLabel = (level: number): string => {
    switch (level) {
        case 1:
            return 'Low';
        case 2:
            return 'Below Average';
        case 3:
            return 'Average';
        case 4:
            return 'Confident';
        case 5:
            return 'High';
        default:
            return '';
    }
};

interface SelfAssessmentCardProps {
    interview: Interview;
    onUpdate: () => void;
}

export const SelfAssessmentCard = ({
    interview,
    onUpdate,
}: SelfAssessmentCardProps) => {
    const [overallFeeling, setOverallFeeling] = useState<
        OverallFeeling | undefined
    >(interview.overall_feeling as OverallFeeling | undefined);
    const [wentWell, setWentWell] = useState(interview.went_well || '');
    const [couldImprove, setCouldImprove] = useState(
        interview.could_improve || ''
    );
    const [confidenceLevel, setConfidenceLevel] = useState<number | undefined>(
        interview.confidence_level
    );
    const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastSavedRef = useRef({
        overall_feeling: interview.overall_feeling,
        went_well: interview.went_well || '',
        could_improve: interview.could_improve || '',
        confidence_level: interview.confidence_level,
    });

    const hasChanges = useCallback(() => {
        return (
            overallFeeling !== lastSavedRef.current.overall_feeling ||
            wentWell !== lastSavedRef.current.went_well ||
            couldImprove !== lastSavedRef.current.could_improve ||
            confidenceLevel !== lastSavedRef.current.confidence_level
        );
    }, [overallFeeling, wentWell, couldImprove, confidenceLevel]);

    const performAutoSave = useCallback(async () => {
        if (!hasChanges()) return;

        setAutoSaveStatus('saving');
        try {
            await updateInterview(interview.id, {
                overall_feeling: overallFeeling,
                went_well: wentWell || undefined,
                could_improve: couldImprove || undefined,
                confidence_level: confidenceLevel,
            });
            lastSavedRef.current = {
                overall_feeling: overallFeeling,
                went_well: wentWell,
                could_improve: couldImprove,
                confidence_level: confidenceLevel,
            };
            setAutoSaveStatus('saved');
            onUpdate();
        } catch {
            setAutoSaveStatus('error');
            toast.error('Failed to save self-assessment');
        }
    }, [
        interview.id,
        overallFeeling,
        wentWell,
        couldImprove,
        confidenceLevel,
        hasChanges,
        onUpdate,
    ]);

    useEffect(() => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            performAutoSave();
        }, 30000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [wentWell, couldImprove, performAutoSave]);

    const handleOverallFeelingChange = async (value: OverallFeeling) => {
        setOverallFeeling(value);
        setAutoSaveStatus('saving');
        try {
            await updateInterview(interview.id, { overall_feeling: value });
            lastSavedRef.current.overall_feeling = value;
            setAutoSaveStatus('saved');
            onUpdate();
        } catch {
            setAutoSaveStatus('error');
            toast.error('Failed to save overall feeling');
        }
    };

    const handleConfidenceLevelChange = async (level: number) => {
        setConfidenceLevel(level);
        setAutoSaveStatus('saving');
        try {
            await updateInterview(interview.id, { confidence_level: level });
            lastSavedRef.current.confidence_level = level;
            setAutoSaveStatus('saved');
            onUpdate();
        } catch {
            setAutoSaveStatus('error');
            toast.error('Failed to save confidence level');
        }
    };

    const headerAction = (
        <div className="h-4">
            {autoSaveStatus === 'saving' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                </span>
            )}
            {autoSaveStatus === 'saved' && (
                <span className="text-xs text-green-600">Saved</span>
            )}
            {autoSaveStatus === 'error' && (
                <span className="text-xs text-red-600">Error saving</span>
            )}
        </div>
    );

    return (
        <InterviewDetailCard title="Self-Assessment" headerAction={headerAction}>
            <div className="space-y-4">
                {/* Overall Feeling */}
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs font-medium">
                        Overall Feeling
                    </Label>
                    <Select
                        value={overallFeeling}
                        onValueChange={(value) =>
                            handleOverallFeelingChange(value as OverallFeeling)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="How did it go?" />
                        </SelectTrigger>
                        <SelectContent>
                            {OVERALL_FEELINGS.map((feeling) => (
                                <SelectItem
                                    key={feeling.value}
                                    value={feeling.value}
                                >
                                    {feeling.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* What went well */}
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs font-medium">
                        What went well
                    </Label>
                    <Textarea
                        value={wentWell}
                        onChange={(e) => setWentWell(e.target.value)}
                        placeholder="What aspects of the interview went well?"
                        className="min-h-[80px] resize-none"
                    />
                </div>

                {/* What could improve */}
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs font-medium">
                        What could improve
                    </Label>
                    <Textarea
                        value={couldImprove}
                        onChange={(e) => setCouldImprove(e.target.value)}
                        placeholder="What would you do differently?"
                        className="min-h-[80px] resize-none"
                    />
                </div>

                {/* Confidence Level */}
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs font-medium">
                        Confidence Level (1-5)
                    </Label>
                    <div className="flex items-center gap-2">
                        {CONFIDENCE_LEVELS.map((level) => (
                            <button
                                key={level}
                                type="button"
                                onClick={() => handleConfidenceLevelChange(level)}
                                className={cn(
                                    'h-8 w-8 rounded text-sm font-medium transition-colors',
                                    confidenceLevel === level
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                )}
                            >
                                {level}
                            </button>
                        ))}
                        {confidenceLevel && (
                            <span className="text-xs text-muted-foreground ml-1">
                                {getConfidenceLabel(confidenceLevel)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </InterviewDetailCard>
    );
};
