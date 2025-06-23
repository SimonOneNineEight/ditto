'use client';

import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import React, { useState } from 'react';
import { Minus, ChevronDown } from 'lucide-react';

type Props = {
    jobDescription: string;
};

const JobDescription = ({ jobDescription }: Props) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="flex justify-between items-center gap-4 mb-2">
                <h3>Job Description</h3>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        hasIcon
                        iconPosition="only"
                        icon={isOpen ? <Minus /> : <ChevronDown />}
                    />
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
                <p>{jobDescription}</p>
            </CollapsibleContent>
        </Collapsible>
    );
};

export default JobDescription;
