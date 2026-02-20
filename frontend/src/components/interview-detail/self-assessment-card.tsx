'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

import { InterviewDetailCard } from './interview-detail-card';
import { AutoSaveIndicator } from '@/components/auto-save-indicator';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitizer';
import { useClickOutside } from '@/hooks/use-click-outside';

const RichTextEditor = dynamic(
    () =>
        import('@/components/rich-text-editor').then((mod) => ({
            default: mod.RichTextEditor,
        })),
    {
        loading: () => <Skeleton className="h-[120px] w-full rounded-lg" />,
        ssr: false,
    }
);
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

type EditingField = 'went_well' | 'could_improve' | null;

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
    const [editingField, setEditingField] = useState<EditingField>(null);

    const performAutoSaveRef = useRef<(() => void) | null>(null);
    const closeEditor = useCallback(() => {
        performAutoSaveRef.current?.();
        setEditingField(null);
    }, []);
    const wentWellEditorRef = useClickOutside<HTMLDivElement>(closeEditor, editingField === 'went_well');
    const couldImproveEditorRef = useClickOutside<HTMLDivElement>(closeEditor, editingField === 'could_improve');

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
    performAutoSaveRef.current = performAutoSave;

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
        }
    };

    const isEmpty = (content: string) => !content || content === '<p></p>';

    const renderRichField = (
        field: 'went_well' | 'could_improve',
        label: string,
        value: string,
        onChange: (val: string) => void,
        placeholder: string,
        ref: React.RefObject<HTMLDivElement>
    ) => {
        const isEditing = editingField === field;

        return (
            <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-medium">
                    {label}
                </Label>
                {isEditing ? (
                    <div ref={ref} className="space-y-2">
                        <RichTextEditor
                            value={value}
                            onChange={onChange}
                            placeholder={placeholder}
                        />
                        <div className="flex justify-end">
                            <Button
                                variant="ghost-primary"
                                size="sm"
                                onClick={closeEditor}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                ) : isEmpty(value) ? (
                    <div
                        className="text-sm text-muted-foreground cursor-pointer py-1 hover:text-foreground transition-colors"
                        onClick={() => setEditingField(field)}
                    >
                        {placeholder}
                    </div>
                ) : (
                    <div
                        className="prose prose-invert max-w-none text-sm cursor-pointer"
                        dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(value),
                        }}
                        onClick={() => setEditingField(field)}
                    />
                )}
            </div>
        );
    };

    const headerAction = (
        <AutoSaveIndicator
            status={autoSaveStatus}
            onRetry={() => performAutoSaveRef.current?.()}
            data-testid="autosave-status"
        />
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

                {renderRichField(
                    'went_well',
                    'What went well',
                    wentWell,
                    setWentWell,
                    'What aspects of the interview went well?',
                    wentWellEditorRef
                )}

                {renderRichField(
                    'could_improve',
                    'What could improve',
                    couldImprove,
                    setCouldImprove,
                    'What would you do differently?',
                    couldImproveEditorRef
                )}

                {/* Confidence Level */}
                <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs font-medium">
                        Confidence Level (1-5)
                    </Label>
                    <div className="flex items-center gap-2" role="radiogroup" aria-label="Confidence level">
                        {CONFIDENCE_LEVELS.map((level) => (
                            <button
                                key={level}
                                type="button"
                                role="radio"
                                aria-checked={confidenceLevel === level}
                                aria-label={`${level} - ${getConfidenceLabel(level)}`}
                                onClick={() => handleConfidenceLevelChange(level)}
                                className={cn(
                                    'h-8 w-8 rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
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
