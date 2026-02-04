'use client';

import { Progress } from '@/components/ui/progress';
import { type StorageStats, bytesToMB } from '@/services/storage-service';
import { HardDrive, AlertTriangle, AlertCircle } from 'lucide-react';
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
        <div className={cn('rounded-lg border bg-card p-4 flex flex-col gap-3', className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Storage</span>
                    {stats.warning && !stats.limit_reached && (
                        <div className="flex items-center gap-1 text-sm text-secondary">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    )}
                    {stats.limit_reached && (
                        <div className="flex items-center gap-1 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">
                    {usedMB} MB / {totalMB} MB
                </span>
            </div>

            <Progress
                value={percentage}
                className="h-1.5"
                indicatorClassName={getIndicatorColor()}
            />
        </div>
    );
}
