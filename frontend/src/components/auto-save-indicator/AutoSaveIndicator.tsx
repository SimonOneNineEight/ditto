'use client';

import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AutoSaveStatus } from '@/hooks/useAutoSave';

export interface AutoSaveIndicatorProps {
    status: AutoSaveStatus;
    lastSaved?: Date | null;
    onRetry?: () => void;
    className?: string;
}

function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AutoSaveIndicator({
    status,
    lastSaved,
    onRetry,
    className,
}: AutoSaveIndicatorProps) {
    if (status === 'idle') {
        return null;
    }

    return (
        <div
            className={cn('flex items-center gap-2', className)}
            aria-live="polite"
            aria-atomic="true"
        >
            {status === 'saving' && (
                <>
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Saving...</span>
                </>
            )}

            {status === 'saved' && (
                <>
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">
                        Saved{lastSaved && ` at ${formatTimestamp(lastSaved)}`}
                    </span>
                </>
            )}

            {status === 'error' && (
                <>
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span className="text-xs text-destructive">Save failed</span>
                    {onRetry && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRetry}
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                        >
                            Retry
                        </Button>
                    )}
                </>
            )}
        </div>
    );
}
