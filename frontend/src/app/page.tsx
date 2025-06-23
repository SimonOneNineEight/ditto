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

    return <div>Dashboard</div>;
}
