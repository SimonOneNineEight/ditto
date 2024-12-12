"use client"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { JobTableRow } from "@/types"
import { Button } from "@/components/ui/button"

export const columns: ColumnDef<JobTableRow>[] = [
    {
        accessorKey: "id",
        header: "ID",
    },
    {
        accessorKey: "company",
        header: "Company",
    },
    {
        accessorKey: "title",
        header: "Title",
    },
    {
        accessorKey: "location",
        header: "Location",
    },
    {
        accessorKey: "date",
        header: "Date",
    },
    {
        accessorKey: "applyStatus",
        header: "Apply Status",
    },
    {
        accessorKey: "jobUrl",
        header: "Job Url",
        cell: ({ row }) => {
            return (<Link href={row.original.jobUrl}><Button>Visit Job</Button></Link>)
        }
    }

]
