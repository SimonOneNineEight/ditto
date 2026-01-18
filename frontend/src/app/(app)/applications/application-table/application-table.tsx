'use client';

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';

import { Plus } from 'lucide-react';

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
import { Application } from './columns';

interface DataTableProps {
    columns: ColumnDef<Application>[];
    data: Application[];
}

export function ApplicationTable({ columns, data }: DataTableProps) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    const router = useRouter();

    return (
        <div className="rounded-md">
            <div className="flex justify-end items-center mb-2 mr-2">
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
            <Table className="mb-2">
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
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
                                data-state={row.getIsSelected() && 'selected'}
                                onClick={() =>
                                    router.push(
                                        `/applications/${row.original.id}`
                                    )
                                }
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
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
            <div
                id="application-table-footer"
                className="flex justify-end pr-2"
            >
                <span className="text-metadata">Total Applications: 2</span>
            </div>
        </div>
    );
}
