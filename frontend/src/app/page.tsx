import { Navbar, JobTable } from '@/components';
import { columns } from '@/components/JobTable';
import { convertJobResponseToTableRow } from '@/lib/utils';
import { JobTableRow } from '@/types';
import { jobService } from '@/services/jobService';
import { SidebarTriggerButton } from '@/components/Sidebar';
// import JobViewTab from "@/components/JobViewTab/JobViewTab";
import { Menu } from 'lucide-react';

export default async function Home() {
    // const jobs = await jobService.getAllJobs();
    // const job_rows: JobTableRow[] = convertJobResponseToTableRow(jobs)

    return (
        <div className="flex flex-col gap-8 row-start-2 items-center m-4">
            <main className="w-full max-w-full p-6 flex flex-col gap-6 min-w-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="pb-2">Interviews</h1>
                        <h5>
                            Some Motivating sentence to help people keep going
                        </h5>
                    </div>
                    <SidebarTriggerButton icon={<Menu />} />
                </div>
                {/* <JobViewTab /> */}
                {/* <JobTable columns={columns} data={job_rows} /> */}
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center"></footer>
        </div>
    );
}
