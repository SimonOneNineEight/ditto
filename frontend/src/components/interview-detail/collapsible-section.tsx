'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    emptyState?: {
        message: string;
        actionLabel: string;
        onAction: () => void;
    };
    isEmpty?: boolean;
    onAdd?: () => void;
}

export const CollapsibleSection = ({
    title,
    children,
    defaultOpen,
    emptyState,
    isEmpty = false,
    onAdd,
}: CollapsibleSectionProps) => {
    // Default to closed if empty, open if has content
    const [isOpen, setIsOpen] = useState(defaultOpen ?? !isEmpty);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between py-2 cursor-pointer group">
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium uppercase tracking-wider">
                            {title}
                        </span>
                    </div>
                    {onAdd && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(true);
                                onAdd();
                            }}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    )}
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="pl-6 pb-4">
                    {isEmpty && emptyState ? (
                        <p className="text-sm text-muted-foreground py-2">
                            {emptyState.message}
                        </p>
                    ) : (
                        children
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};
