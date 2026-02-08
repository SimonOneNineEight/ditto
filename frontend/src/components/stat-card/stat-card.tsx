'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
    label: string;
    value: number;
    icon: LucideIcon;
    variant?: 'default' | 'accent';
    onClick?: () => void;
}

export function StatCard({
    label,
    value,
    icon: Icon,
    variant = 'default',
    onClick,
}: StatCardProps) {
    const isAccent = variant === 'accent';

    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col gap-3 rounded-lg border border-border bg-transparent p-5 text-left transition-colors',
                'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'flex-1 min-w-0'
            )}
        >
            <div className="flex items-center justify-between w-full">
                <span className="text-[13px] font-medium text-muted-foreground">
                    {label}
                </span>
                <Icon
                    className={cn(
                        'h-[18px] w-[18px]',
                        isAccent ? 'text-accent' : 'text-primary'
                    )}
                />
            </div>
            <span
                className={cn(
                    'text-[32px] font-semibold leading-none',
                    isAccent ? 'text-accent' : 'text-foreground'
                )}
            >
                {value}
            </span>
        </button>
    );
}
