"use client"

import { useState } from 'react'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, RowData } from "@tanstack/react-table"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { jobService } from "@/services/job-service"
import { JobTableRow } from '@/types'
import { convertJobResponseToTableRow } from "@/lib/utils"
import { ScrapeButton } from '.'


interface JobTableProps {
    columns: ColumnDef<JobTableRow, unknown>[],
    data: JobTableRow[]
}

declare module "@tanstack/react-table" {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface TableMeta<TData extends RowData> {
        handleStatusChange?: (id: string, newStatus: string) => Promise<void>
    }
}


const JobTable = ({ columns, data }: JobTableProps) => {
    const [jobs, setJobs] = useState<JobTableRow[]>(data || []);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await jobService.handleStatusChange(id, newStatus);
            const newData = await jobService.getAllJobs();
            setJobs(convertJobResponseToTableRow(newData));
        } catch (error) {
            console.error('Status change failed: ', error);
        }
    }

    const table = useReactTable({
        data: jobs,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            handleStatusChange
        }
    })

    return (
        <div className="mb-4">
            <div>
                <ScrapeButton setJobs={setJobs} />
            </div>
            <Table>
                <TableCaption>Keep going and you will find the place you belong</TableCaption>
                <TableHeader>
                    {
                        table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (<TableHead key={header.id}>
                                        {
                                            header.isPlaceholder ?
                                                null :
                                                flexRender(header.column.columnDef.header, header.getContext())
                                        }
                                    </TableHead>)
                                })}
                            </TableRow>
                        ))
                    }
                </TableHeader>
                <TableBody>
                    {
                        table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) =>
                            (<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>)
                            )
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )
                    }
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={6}>Total</TableCell>
                        <TableCell className="text-right">{data.length}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>

    )
}

export default JobTable
