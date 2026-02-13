'use client';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';

import { ChevronLeft, ChevronRight } from 'lucide-react';

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
import { MobileAppCard } from '@/components/applications/MobileAppCard';
import { useBreakpoint } from '@/hooks/use-breakpoint';

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
    const breakpoint = useBreakpoint();
    const isMobile = breakpoint === 'mobile';
    const totalPages = Math.ceil(total / limit);

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    const renderPagination = () => (
        <div className="flex items-center justify-between px-4 md:px-5 py-3 border-t border-border">
            <span className="text-[13px] text-muted-foreground">
                {startItem}-{endItem} of {total}
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="h-10 w-10 md:h-8 md:w-8"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((pageNum) => (
                        <Button
                            key={pageNum}
                            variant={pageNum === page ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onPageChange(pageNum)}
                            className={`h-10 min-w-10 md:h-8 md:min-w-8 px-2.5 text-[13px] ${pageNum !== page ? 'bg-transparent hover:bg-transparent text-muted-foreground hover:text-foreground' : ''}`}
                        >
                            {pageNum}
                        </Button>
                    ))}
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="h-10 w-10 md:h-8 md:w-8"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );

    if (data.length === 0) {
        return (
            <div className="rounded-lg border border-border">
                <div className="h-24 flex items-center justify-center text-muted-foreground">
                    {hasActiveFilters
                        ? 'No applications match your filters'
                        : 'No applications yet. Create your first one!'}
                </div>
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex flex-col gap-2 p-3">
                    {data.map((application) => (
                        <MobileAppCard key={application.id} application={application} />
                    ))}
                </div>
                {renderPagination()}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg">
            <Table className="w-full">
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
                    {table.getRowModel().rows.map((row) => (
                        <TableRow
                            key={row.id}
                            className="cursor-pointer hover:bg-muted"
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
                    ))}
                </TableBody>
            </Table>
            {renderPagination()}
        </div>
    );
}
