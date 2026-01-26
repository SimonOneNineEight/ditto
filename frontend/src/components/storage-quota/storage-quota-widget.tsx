'use client';

import { Progress } from '@/components/ui/progress';
import { type StorageStats, bytesToMB } from '@/services/storage-service';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorageQuotaWidgetProps {
    stats: StorageStats;
    className?: string;
}

export function StorageQuotaWidget({ stats, className }: StorageQuotaWidgetProps) {
    const usedMB = bytesToMB(stats.used_bytes);
    const totalMB = bytesToMB(stats.total_bytes);
    const percentage = stats.usage_percentage;

    const getIndicatorColor = () => {
        if (stats.limit_reached) return 'bg-destructive';
        if (stats.warning) return 'bg-secondary';
        return 'bg-primary';
    };

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Storage:</span>
                    <span>{usedMB} MB / {totalMB} MB</span>
                    <span className="text-muted-foreground">({stats.file_count} {stats.file_count === 1 ? 'file' : 'files'})</span>
                </div>

                {stats.warning && !stats.limit_reached && (
                    <div className="flex items-center gap-1 text-sm text-secondary">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Almost full</span>
                    </div>
                )}

                {stats.limit_reached && (
                    <div className="flex items-center gap-1 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>Limit reached</span>
                    </div>
                )}
            </div>

            <Progress
                value={percentage}
                className="h-1.5"
                indicatorClassName={getIndicatorColor()}
            />
        </div>
    );
}
