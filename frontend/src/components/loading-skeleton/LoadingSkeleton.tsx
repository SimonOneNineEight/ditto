'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardSkeletonProps {
    className?: string;
}

export function StatCardSkeleton({ className }: StatCardSkeletonProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-lg border border-border bg-transparent p-5 flex-1 min-w-0',
                className
            )}
        >
            <div className="flex items-center justify-between w-full">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-[18px] w-[18px] rounded" />
            </div>
            <Skeleton className="h-8 w-16" />
        </div>
    );
}

interface TableRowSkeletonProps {
    columns?: number;
    className?: string;
}

export function TableRowSkeleton({ columns = 5, className }: TableRowSkeletonProps) {
    return (
        <div className={cn('flex items-center gap-4 py-4 px-4 border-b', className)}>
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn('h-4', i === 0 ? 'w-32' : 'w-20', 'flex-shrink-0')}
                />
            ))}
        </div>
    );
}

interface ListItemSkeletonProps {
    className?: string;
    showAvatar?: boolean;
}

export function ListItemSkeleton({ className, showAvatar = false }: ListItemSkeletonProps) {
    return (
        <div className={cn('flex items-center gap-4 py-3', className)}>
            {showAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

interface CardSkeletonProps {
    className?: string;
    lines?: number;
}

export function CardSkeleton({ className, lines = 3 }: CardSkeletonProps) {
    return (
        <div className={cn('rounded-lg border border-border p-4 space-y-3', className)}>
            <Skeleton className="h-5 w-1/3" />
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
                />
            ))}
        </div>
    );
}

interface UpcomingItemSkeletonProps {
    className?: string;
}

export function UpcomingItemSkeleton({ className }: UpcomingItemSkeletonProps) {
    return (
        <div className={cn('flex items-start gap-4 py-3', className)}>
            <Skeleton className="h-10 w-10 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
    );
}

interface DashboardStatsSkeletonProps {
    count?: number;
}

export function DashboardStatsSkeleton({ count = 4 }: DashboardStatsSkeletonProps) {
    return (
        <div className="flex gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>
    );
}

interface ApplicationListSkeletonProps {
    count?: number;
}

export function ApplicationListSkeleton({ count = 5 }: ApplicationListSkeletonProps) {
    return (
        <div className="space-y-0">
            {Array.from({ length: count }).map((_, i) => (
                <TableRowSkeleton key={i} columns={6} />
            ))}
        </div>
    );
}
