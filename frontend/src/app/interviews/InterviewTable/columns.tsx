'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Pencil, Trash, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Simple meta interface for Tailwind classes
export interface ColumnMeta {
    className?: string;
}

export type Interview = {
    id: string;
    company: string;
    position: string;
    stage: string;
    tags: string[];
    interviewDate: string;
    notes: string;
    interviewerName: string;
    interviewerUrl: string;
};

export const columns: (ColumnDef<Interview, any> & { meta?: ColumnMeta })[] = [
    {
        accessorKey: 'company',
        header: 'Company',
        meta: {
            className: 'w-[15%]',
        },
    },
    {
        accessorKey: 'position',
        header: 'Position',
        meta: {
            className: 'w-[15%]',
        },
    },
    {
        accessorKey: 'stage',
        header: 'Stage',
        cell: ({ row }) => {
            return <Badge className="">{row.original.stage}</Badge>;
        },
        meta: {
            className: 'w-25',
        },
    },
    {
        accessorKey: 'interviewDate',
        header: 'Date',
        meta: {
            className: 'w-30',
        },
    },
    {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => {
            return (
                <div className="flex-wrap gap-2">
                    {row.original.tags.map((tag) => (
                        <Badge variant="outline">{`#${tag}`}</Badge>
                    ))}
                </div>
            );
        },
    },

    {
        accessorKey: 'interviewer',
        header: 'Interviewer',
        cell: ({ row }) => {
            return (
                <Link href={row.original.interviewerUrl}>
                    <span>{row.original.interviewerName}</span>
                </Link>
            );
        },
    },

    {
        id: 'action',
        header: 'Actions',
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-2">
                    <FileText size={16} />
                    <Pencil size={16} />
                    <Trash size={16} />
                </div>
            );
        },
    },
];
