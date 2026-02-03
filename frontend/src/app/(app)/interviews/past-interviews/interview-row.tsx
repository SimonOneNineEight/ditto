'use client';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { InterviewRow, ColumnMeta } from './interview-row-column';

interface DataTableProps {
    columns: ColumnDef<InterviewRow, unknown>[];
    data: InterviewRow[];
    applicationId: string;
}

export function PastInterviewRow({
    columns,
    data,
    applicationId,
}: DataTableProps) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const router = useRouter();

    return (
        <div className="w-full rounded-md">
            <div className="overflow-x-auto w-full">
                <Table className="table-fixed min-w-[65vw] w-full mb-2">
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
                                            `/applications/${applicationId}`
                                        )
                                    }
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
            <div
                id="application-table-footer"
                className="flex justify-end pr-2"
            >
                <span className="text-metadata">
                    Total Interview: {data.length}
                </span>
            </div>
        </div>
    );
}
