'use client';

import { useEffect, useState, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { NotificationPreferences as NotificationPreferencesType } from '@/types/notification';
import * as notificationService from '@/services/notification-service';

interface PreferenceRowProps {
    title: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function PreferenceRow({ title, description, checked, onChange }: PreferenceRowProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{title}</span>
                <span className="text-xs text-muted-foreground">{description}</span>
            </div>
            <Switch checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

export function NotificationPreferences() {
    const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        notificationService.getPreferences()
            .then(setPreferences)
            .catch(() => toast.error('Failed to load notification preferences'))
            .finally(() => setIsLoading(false));
    }, []);

    const updatePreference = useCallback(
        async (key: keyof NotificationPreferencesType, value: boolean) => {
            if (!preferences) return;

            const updated = { ...preferences, [key]: value };
            setPreferences(updated);

            try {
                await notificationService.updatePreferences({
                    interview_24h: updated.interview_24h,
                    interview_1h: updated.interview_1h,
                    assessment_3d: updated.assessment_3d,
                    assessment_1d: updated.assessment_1d,
                    assessment_1h: updated.assessment_1h,
                });
                toast.success('Preference saved');
            } catch {
                setPreferences(preferences);
                toast.error('Failed to save preference');
            }
        },
        [preferences]
    );

    if (isLoading || !preferences) {
        return (
            <div className="rounded-lg border bg-card p-6">
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
            </div>
        );
    }

    return (
        <div className="rounded-lg border bg-card p-6">
            <h3 className="text-base font-semibold">Notifications</h3>
            <div className="mt-5 flex flex-col gap-5">
                <div className="flex flex-col gap-4">
                    <span className="text-[13px] font-semibold tracking-wide">
                        Interview Reminders
                    </span>
                    <div className="flex flex-col gap-4">
                        <PreferenceRow
                            title="24 hours before"
                            description="Get reminded one day before your interview"
                            checked={preferences.interview_24h}
                            onChange={(v) => updatePreference('interview_24h', v)}
                        />
                        <PreferenceRow
                            title="1 hour before"
                            description="Get reminded one hour before your interview"
                            checked={preferences.interview_1h}
                            onChange={(v) => updatePreference('interview_1h', v)}
                        />
                    </div>
                </div>

                <div className="h-px bg-border" />

                <div className="flex flex-col gap-4">
                    <span className="text-[13px] font-semibold tracking-wide">
                        Assessment Deadline Reminders
                    </span>
                    <div className="flex flex-col gap-4">
                        <PreferenceRow
                            title="3 days before deadline"
                            description="Get reminded 3 days before an assessment is due"
                            checked={preferences.assessment_3d}
                            onChange={(v) => updatePreference('assessment_3d', v)}
                        />
                        <PreferenceRow
                            title="1 day before deadline"
                            description="Get reminded 1 day before an assessment is due"
                            checked={preferences.assessment_1d}
                            onChange={(v) => updatePreference('assessment_1d', v)}
                        />
                        <PreferenceRow
                            title="1 hour before deadline"
                            description="Get reminded 1 hour before an assessment is due"
                            checked={preferences.assessment_1h}
                            onChange={(v) => updatePreference('assessment_1h', v)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
