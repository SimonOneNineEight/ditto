import { Navbar, JobTable } from '@/components';
import { columns } from '@/components/JobTable';
import { convertJobResponseToTableRow } from '@/lib/utils';
import { JobTableRow } from '@/types';
import { jobService } from '@/services/jobService';
// import JobViewTab from "@/components/JobViewTab/JobViewTab";

export default async function Home() {
    // const jobs = await jobService.getAllJobs();
    // const job_rows: JobTableRow[] = convertJobResponseToTableRow(jobs)

    return (
        <div className="flex flex-col gap-8 row-start-2 items-center m-4">
            <main className="max-w-[1440px] w-full">
                <Navbar />
                {/* <JobViewTab /> */}
                {/* <JobTable columns={columns} data={job_rows} /> */}
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
        </div>
    );
}
