'use client';

import { X, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/lib/file-service';
import type { FileUploadStatus } from '@/hooks/useFileUpload';

interface UploadProgressProps {
    fileName: string;
    progress: number;
    status: FileUploadStatus;
    error: string | null;
    speed: number | null;
    estimatedTimeRemaining: number | null;
    totalBytes: number;
    onCancel: () => void;
    onRetry: () => void;
}

function formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond >= 1024 * 1024) {
        return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
    return `${Math.round(bytesPerSecond / 1024)} KB/s`;
}

function formatEta(seconds: number): string {
    if (seconds < 1) return '< 1s remaining';
    if (seconds < 60) return `~${Math.ceil(seconds)}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `~${mins}m ${secs}s remaining`;
}

const STATUS_STYLES: Record<FileUploadStatus, { bar: string; label: string }> = {
    idle: { bar: '', label: '' },
    uploading: { bar: 'bg-secondary', label: '' },
    confirming: { bar: 'bg-secondary', label: 'Confirming...' },
    completed: { bar: 'bg-accent', label: 'Uploaded' },
    failed: { bar: 'bg-destructive', label: '' },
    cancelled: { bar: 'bg-muted-foreground/40', label: 'Cancelled' },
};

export function UploadProgress({
    fileName,
    progress,
    status,
    error,
    speed,
    estimatedTimeRemaining,
    totalBytes,
    onCancel,
    onRetry,
}: UploadProgressProps) {
    const styles = STATUS_STYLES[status];
    const isActive = status === 'uploading' || status === 'confirming';

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                {status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-accent" />
                ) : (
                    <div className="h-5 w-5 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatFileSize(totalBytes)}
                        {styles.label && ` · ${styles.label}`}
                        {status === 'uploading' && speed !== null && ` · ${formatSpeed(speed)}`}
                        {status === 'uploading' && estimatedTimeRemaining !== null && ` · ${formatEta(estimatedTimeRemaining)}`}
                    </p>
                </div>

                {isActive && (
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCancel();
                        }}
                        aria-label="Cancel upload"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}

                {status === 'failed' && (
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRetry();
                        }}
                        aria-label="Retry upload"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Progress
                value={status === 'completed' ? 100 : progress}
                className="h-1.5"
                indicatorClassName={styles.bar}
                aria-label="File upload progress"
            />

            {status === 'uploading' && (
                <p className="text-xs text-muted-foreground text-right">{progress}%</p>
            )}

            {status === 'failed' && error && (
                <p className="text-xs text-destructive" role="alert">{error}</p>
            )}
        </div>
    );
}
