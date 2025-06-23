'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Application = {
    id: string;
    company: string;
    position: string;
    status: string;
    location: string;
    tags: string[];
    applyDate: string;
};

export const columns: ColumnDef<Application>[] = [
    {
        accessorKey: 'company',
        header: 'Company',
    },
    {
        accessorKey: 'position',
        header: 'Position',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            return <Badge className="">{row.original.status}</Badge>;
        },
    },
    {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => {
            return <Badge className="">{row.original.location}</Badge>;
        },
    },
    {
        accessorKey: 'applyDate',
        header: 'Apply Date',
    },
    {
        accessorKey: 'tags',
        header: 'Tags',
        cell: ({ row }) => {
            console.log(row.original);
            return (
                <div className="flex gap-2">
                    {row.original.tags.map((tag) => (
                        <Badge variant="outline">{`#${tag}`}</Badge>
                    ))}
                </div>
            );
        },
    },

    {
        id: 'action',
        header: 'Actions',
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <FileText size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Resume</DropdownMenuItem>
                            <DropdownMenuItem>Cover Letter</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Pencil size={16} />
                    <Trash size={16} />
                </div>
            );
        },
    },
];
