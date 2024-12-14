"use client"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { JobTableRow } from "@/types"
import { Button } from "@/components/ui/button"
import ApplyStatusDropdown from "./ApplyStatusDropdown"

export const columns: ColumnDef<JobTableRow>[] = [
    {
        accessorKey: "id",
        header: () => <div className="text-center">ID</div>,
    },
    {
        accessorKey: "company",
        header: () => <div className="text-center">Company</div>,
    },
    {
        accessorKey: "title",
        header: () => <div className="text-center">Title</div>,
    },
    {
        accessorKey: "location",
        header: () => <div className="text-center">Location</div>,
    },
    {
        accessorKey: "date",
        header: () => <div className="text-center">Date</div>,
        cell: ({ row }) => {
            return new Date(row.original.date).toLocaleDateString();
        }
    },
    {
        accessorKey: "applyStatus",
        header: () => <div className="text-center">Apply Status</div>,
        cell: ({ row, table }) => {
            const id = row.original.id;
            const status = row.original.applyStatus;
            return (
                <div className="flex justify-center">
                    <ApplyStatusDropdown id={id} status={status} onStatusChange={table.options.meta?.handleStatusChange} />
                </div>
            );
        }
    },
    {
        accessorKey: "jobUrl",
        header: () => <div className="text-center">Job Url</div>,
        cell: ({ row }) => {
            return (
                <Link href={row.original.jobUrl} target="_blank" className="hover:opacity-70">
                    <Button variant="link">Visit Job</Button>
                </Link>
            )
        }
    }

]
