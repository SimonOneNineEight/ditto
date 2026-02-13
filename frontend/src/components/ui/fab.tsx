'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const fabVariants = cva(
    'inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_12px_rgba(0,0,0,0.25)]',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_4px_12px_rgba(0,0,0,0.25)]',
            },
            size: {
                default: 'h-[52px] w-[52px]',
                sm: 'h-11 w-11',
                lg: 'h-16 w-16',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface FABProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof fabVariants> {
    asChild?: boolean;
}

const FAB = React.forwardRef<HTMLButtonElement, FABProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(fabVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
FAB.displayName = 'FAB';

export { FAB, fabVariants };
