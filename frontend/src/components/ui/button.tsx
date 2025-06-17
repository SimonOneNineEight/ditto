import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default:
                    'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
                outline:
                    'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                warning:
                    'bg-warning text-warning-foreground shadow-xs hover:bg-warning/90',
                info: 'bg-info text-info-foreground shadow-xs hover:bg-info/90',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-md px-8',
                icon: 'h-9 w-9',
                full: 'w-full h-9 px-4 py-2',
            },
            isLoading: {
                true: 'cursor-not-allowed',
                false: '',
            },

            hasIcon: {
                true: '',
                false: '',
            },
            iconPosition: {
                left: 'flex-row',
                right: 'flex-row-reverse',
                only: 'p-0',
                none: '',
            },
        },
        compoundVariants: [
            {
                hasIcon: true,
                iconPosition: 'left',
                class: '[&>svg:not(.animate-spin)]:mr-2',
            },
            {
                hasIcon: true,
                iconPosition: 'right',
                class: '[&>svg:not(.animate-spin)]:ml-2',
            },
            {
                hasIcon: true,
                iconPosition: 'only',
                size: 'sm',
                class: 'w-6 h-6',
            },
            {
                hasIcon: true,
                iconPosition: 'only',
                size: 'default',
                class: 'w-8 h-8',
            },
            {
                hasIcon: true,
                iconPosition: 'only',
                size: 'lg',
                class: 'w-10 h-10',
            },
            {
                hasIcon: true,
                iconPosition: 'left',
                class: 'justify-start',
            },
            {
                hasIcon: true,
                iconPosition: 'right',
                class: 'justify-start',
            },
        ],
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

// Extract variant props but exclude conflicting ones
type ButtonVariants = Omit<VariantProps<typeof buttonVariants>, 'isLoading' | 'hasIcon' | 'iconPosition'>;

// Base props for all button variants
type BaseButtonProps = {
    asChild?: boolean;
    isLoading?: boolean;
    loadingText?: string;
};

// Icon-only button props
type IconOnlyProps = {
    iconPosition: 'only';
    hasIcon: true;
    icon: React.ReactNode;
    children?: never; // No children allowed for icon-only
};

// Button with left/right icon props
type ButtonWithIconProps = {
    iconPosition: 'left' | 'right';
    hasIcon: true;
    icon: React.ReactNode; // Required when hasIcon is true
    children: React.ReactNode; // Required for text
};

// Button without icon props
type ButtonWithoutIconProps = {
    iconPosition?: 'none';
    hasIcon?: false;
    icon?: never; // No icon allowed
    children: React.ReactNode; // Required for text
};

// Union of all possible button configurations
type ButtonVariantProps =
    | IconOnlyProps
    | ButtonWithIconProps
    | ButtonWithoutIconProps;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
    ButtonVariants &
    BaseButtonProps &
    ButtonVariantProps;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            isLoading = false,
            hasIcon = false,
            icon,
            iconPosition = 'none',
            loadingText,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const Comp = asChild ? Slot : 'button';
        return (
            <Comp
                className={cn(
                    buttonVariants({
                        variant,
                        size,
                        className,
                        hasIcon,
                        iconPosition,
                        isLoading,
                    })
                )}
                disabled={disabled || isLoading}
                ref={ref}
                {...props}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {loadingText && (
                            <span className="ml-2">{loadingText}</span>
                        )}
                    </>
                ) : (
                    <>
                        {hasIcon && icon}
                        {iconPosition !== 'only' && children}
                    </>
                )}
            </Comp>
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
