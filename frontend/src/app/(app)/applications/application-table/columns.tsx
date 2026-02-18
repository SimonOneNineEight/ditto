'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash, FileText, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type ApplicationWithDetails, type SortColumn, type SortOrder } from '@/services/application-service';
import { formatJobType } from '@/lib/constants';
import { format } from 'date-fns';

interface SortState {
    column: SortColumn | null;
    order: SortOrder;
}

interface ColumnOptions {
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    sortState?: SortState;
    onSort?: (column: SortColumn) => void;
}

// Map column IDs to API sort column names
const sortColumnMap: Record<string, SortColumn> = {
    company: 'company',
    position: 'position',
    status: 'status',
    location: 'location',
    applyDate: 'applied_at',
    jobType: 'job_type',
};

interface SortableHeaderProps {
    label: string;
    columnId: string;
    sortState?: SortState;
    onSort?: (column: SortColumn) => void;
    className?: string;
}

type AriaSortValue = 'ascending' | 'descending' | 'none' | undefined;

const SortableHeader = ({ label, columnId, sortState, onSort, className }: SortableHeaderProps) => {
    const sortColumn = sortColumnMap[columnId];
    if (!sortColumn || !onSort) {
        return <span className={`text-xs font-semibold text-muted-foreground ${className || ''}`}>{label}</span>;
    }

    const isActive = sortState?.column === sortColumn;
    const isAsc = isActive && sortState?.order === 'asc';
    const isDesc = isActive && sortState?.order === 'desc';

    return (
        <Button
            variant="ghost"
            size="sm"
            className={`-ml-3 h-8 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground ${className || ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onSort(sortColumn);
            }}
            aria-sort={(isAsc ? 'ascending' : isDesc ? 'descending' : 'none') as AriaSortValue}
        >
            <span>{label}</span>
            {isAsc && <ArrowUp className="ml-1 h-3 w-3" />}
            {isDesc && <ArrowDown className="ml-1 h-3 w-3" />}
            {!isActive && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
        </Button>
    );
};

export const createColumns = (
    options: ColumnOptions = {}
): ColumnDef<ApplicationWithDetails>[] => [
    {
        id: 'company',
        header: () => (
            <SortableHeader
                label="Company"
                columnId="company"
                sortState={options.sortState}
                onSort={options.onSort}
            />
        ),
        minSize: 120,
        maxSize: 200,
        cell: ({ row }) => {
            return (
                <span className="truncate block">
                    {row.original.company?.name || '—'}
                </span>
            );
        },
    },
    {
        id: 'position',
        header: () => (
            <SortableHeader
                label="Position"
                columnId="position"
                sortState={options.sortState}
                onSort={options.onSort}
            />
        ),
        minSize: 150,
        maxSize: 250,
        cell: ({ row }) => {
            return (
                <span className="truncate block">
                    {row.original.job?.title || '—'}
                </span>
            );
        },
    },
    {
        id: 'status',
        header: () => (
            <SortableHeader
                label="Status"
                columnId="status"
                sortState={options.sortState}
                onSort={options.onSort}
            />
        ),
        minSize: 80,
        maxSize: 120,
        cell: ({ row }) => {
            const statusName = row.original.status?.name;
            if (!statusName) return '—';
            // Map status names to badge variants
            const variantMap: Record<string, 'applied' | 'screening' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn' | 'default'> = {
                'Applied': 'applied',
                'Screening': 'screening',
                'Interviewing': 'interviewing',
                'Offered': 'offered',
                'Rejected': 'rejected',
                'Withdrawn': 'withdrawn',
            };
            const variant = variantMap[statusName] || 'default';
            return <Badge variant={variant}>{statusName}</Badge>;
        },
    },
    {
        id: 'location',
        header: () => (
            <SortableHeader
                label="Location"
                columnId="location"
                sortState={options.sortState}
                onSort={options.onSort}
                className="hidden lg:inline-flex"
            />
        ),
        minSize: 100,
        maxSize: 150,
        meta: { className: 'hidden lg:table-cell' },
        cell: ({ row }) => {
            const location = row.original.job?.location;
            if (!location) return <span className="text-muted-foreground">—</span>;
            return <span className="text-[13px] text-muted-foreground">{location}</span>;
        },
    },
    {
        id: 'applyDate',
        header: () => (
            <SortableHeader
                label="Applied"
                columnId="applyDate"
                sortState={options.sortState}
                onSort={options.onSort}
                className="hidden md:inline-flex"
            />
        ),
        minSize: 90,
        maxSize: 110,
        meta: { className: 'hidden md:table-cell' },
        cell: ({ row }) => {
            const date = row.original.applied_at;
            if (!date) return <span className="text-muted-foreground">—</span>;
            return <span className="text-[13px] text-muted-foreground">{format(new Date(date), 'MMM d, yyyy')}</span>;
        },
    },
    {
        id: 'jobType',
        header: () => (
            <SortableHeader
                label="Type"
                columnId="jobType"
                sortState={options.sortState}
                onSort={options.onSort}
                className="hidden lg:inline-flex"
            />
        ),
        minSize: 80,
        maxSize: 120,
        meta: { className: 'hidden lg:table-cell' },
        cell: ({ row }) => {
            return <span className="text-[13px] text-muted-foreground">{formatJobType(row.original.job?.job_type)}</span>;
        },
    },
    {
        id: 'actions',
        header: () => <span className="text-xs font-semibold text-muted-foreground">Actions</span>,
        minSize: 100,
        maxSize: 120,
        cell: ({ row }) => {
            const hasDocuments =
                row.original.resume_file_id || row.original.cover_letter_file_id;

            return (
                <div className="flex items-center gap-2">
                    {hasDocuments && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="Documents">
                                    <FileText size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {row.original.resume_file_id && (
                                    <DropdownMenuItem>Resume</DropdownMenuItem>
                                )}
                                {row.original.cover_letter_file_id && (
                                    <DropdownMenuItem>
                                        Cover Letter
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit application"
                        onClick={(e) => {
                            e.stopPropagation();
                            options.onEdit?.(row.original.id);
                        }}
                    >
                        <Pencil size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete application"
                        onClick={(e) => {
                            e.stopPropagation();
                            options.onDelete?.(row.original.id);
                        }}
                    >
                        <Trash size={16} />
                    </Button>
                </div>
            );
        },
    },
];
