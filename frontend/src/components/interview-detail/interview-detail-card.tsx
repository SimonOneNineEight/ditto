'use client';

import { cn } from '@/lib/utils';

interface InterviewDetailCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    headerAction?: React.ReactNode;
}

export const InterviewDetailCard = ({
    title,
    children,
    className,
    headerAction,
}: InterviewDetailCardProps) => {
    return (
        <div
            className={cn(
                'rounded-lg border border-border bg-card p-6 space-y-4',
                className
            )}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                    {title}
                </h3>
                {headerAction}
            </div>
            {children}
        </div>
    );
};
