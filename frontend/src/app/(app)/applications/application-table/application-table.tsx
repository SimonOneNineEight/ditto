'use client';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';

import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { type ApplicationWithDetails } from '@/services/application-service';

interface DataTableProps {
    columns: ColumnDef<ApplicationWithDetails>[];
    data: ApplicationWithDetails[];
    total: number;
    page: number;
    limit: number;
    hasActiveFilters: boolean;
    onPageChange: (page: number) => void;
}

export function ApplicationTable({
    columns,
    data,
    total,
    page,
    limit,
    hasActiveFilters,
    onPageChange,
}: DataTableProps) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const router = useRouter();
    const totalPages = Math.ceil(total / limit);
    const showing = data.length;

    return (
        <div className="rounded-md">
            <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? `Showing ${showing} of ${total} applications`
                        : `${total} application${total !== 1 ? 's' : ''}`
                    }
                </span>
                <Button
                    size="sm"
                    hasIcon
                    iconPosition="left"
                    icon={<Plus size={16} />}
                    onClick={() => router.push('/applications/new')}
                >
                    New Application
                </Button>
            </div>
            <Table className="mb-2 w-full">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const { minSize, maxSize, meta } = header.column.columnDef;
                                const className = (meta as { className?: string })?.className;
                                return (
                                    <TableHead
                                        key={header.id}
                                        className={className}
                                        style={{
                                            minWidth: minSize,
                                            maxWidth: maxSize,
                                        }}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className="cursor-pointer"
                                onClick={() =>
                                    router.push(`/applications/${row.original.id}`)
                                }
                            >
                                {row.getVisibleCells().map((cell) => {
                                    const { minSize, maxSize, meta } = cell.column.columnDef;
                                    const className = (meta as { className?: string })?.className;
                                    return (
                                        <TableCell
                                            key={cell.id}
                                            className={className}
                                            style={{
                                                minWidth: minSize,
                                                maxWidth: maxSize,
                                            }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center text-muted-foreground"
                            >
                                {hasActiveFilters
                                    ? 'No applications match your filters'
                                    : 'No applications yet. Create your first one!'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 px-2">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
