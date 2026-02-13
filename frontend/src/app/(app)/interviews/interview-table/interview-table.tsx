'use client';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { ColumnMeta, getRowBorderClass } from './columns';
import { InterviewListItem } from '@/services/interview-service';
import { cn } from '@/lib/utils';

interface DataTableProps {
    columns: ColumnDef<InterviewListItem, unknown>[];
    data: InterviewListItem[];
}

export function InterviewTable({ columns, data }: DataTableProps) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const router = useRouter();

    return (
        <div className="w-full overflow-hidden rounded-lg">
            <div className="overflow-x-auto w-full">
                <Table className="table-fixed min-w-[600px] lg:min-w-[768px] w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={
                                                (
                                                    header.column.columnDef
                                                        .meta as ColumnMeta
                                                )?.className
                                            }
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
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
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                    onClick={() =>
                                        router.push(
                                            `/interviews/${row.original.id}`
                                        )
                                    }
                                    className={cn(
                                        'cursor-pointer hover:bg-muted',
                                        getRowBorderClass(
                                            row.original.scheduled_date,
                                            row.original.outcome
                                        )
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={
                                                (
                                                    cell.column.columnDef
                                                        .meta as ColumnMeta
                                                )?.className
                                            }
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
