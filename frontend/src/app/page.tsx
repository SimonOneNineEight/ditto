import { Navbar, JobTable } from "@/components"
import { columns } from "@/components/JobTable"
import { fetchJobs } from "@/lib/api"
import { convertJobResponseToTableRow } from "@/lib/utils";
import { JobTableRow } from "../types"

export default async function Home() {
    const jobs = await fetchJobs();
    const job_rows: JobTableRow[] = convertJobResponseToTableRow(jobs)

    return (
        <div className="p-4 flex flex-col gap-8 row-start-2 items-center mx-8">
            <main className="max-w-[1440px] w-full">
                <Navbar />
                <JobTable columns={columns} data={job_rows} />
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
            </footer>
        </div>
    );
}
