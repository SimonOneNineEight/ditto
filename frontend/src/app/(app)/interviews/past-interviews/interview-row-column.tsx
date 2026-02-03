'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Pencil, Trash, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Simple meta interface for Tailwind classes
export interface ColumnMeta {
    className?: string;
}

export type InterviewRow = {
    id: string;
    stage: string;
    tags: string[];
    interviewDate: string;
    notes: string;
    interviewerName: string;
    interviewerUrl: string;
};

export const columns: (ColumnDef<InterviewRow, unknown> & { meta?: ColumnMeta })[] =
    [
        {
            accessorKey: 'interviewDate',
            header: 'Date',
            meta: {
                className: 'w-28',
            },
            cell: ({ row }) => (
                <div className="flex justify-center">
                    {row.original.interviewDate}
                </div>
            ),
        },
        {
            accessorKey: 'stage',
            header: 'Stage',
            cell: ({ row }) => {
                return (
                    <div className="flex justify-center">
                        <Badge className="">{row.original.stage}</Badge>
                    </div>
                );
            },
            meta: {
                className: 'w-[16%] ',
            },
        },
        {
            accessorKey: 'interviewer',
            header: 'Interviewer',
            cell: ({ row }) => {
                return (
                    <Link
                        href={row.original.interviewerUrl}
                        className="block truncate"
                    >
                        {row.original.interviewerName}
                    </Link>
                );
            },
            meta: { className: 'w-[20%]' },
        },
        {
            accessorKey: 'tags',
            header: 'Tags',
            cell: ({ row }) => {
                return (
                    <div className="flex flex-wrap gap-2">
                        {row.original.tags.map((tag, index) => (
                            <Badge
                                key={index}
                                variant="outline"
                            >{`#${tag}`}</Badge>
                        ))}
                    </div>
                );
            },
        },

        {
            id: 'action',
            header: 'Actions',
            cell: () => {
                return (
                    <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <Pencil size={16} />
                        <Trash size={16} />
                    </div>
                );
            },
            meta: { className: 'w-20' },
        },
    ];
