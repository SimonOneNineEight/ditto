"use client"

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"



interface JobTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[],
    data: TData[]
}


const JobTable = <TData, TValue>({ columns, data }: JobTableProps<TData, TValue>) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    console.log(data);

    return (
        <div className="mb-4">
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
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right">{data.length}</TableCell>
                </TableFooter>
            </Table>
        </div>

    )
}

export default JobTable
