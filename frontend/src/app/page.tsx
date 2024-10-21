import { Navbar, JobTable } from "@/components"
import { columns } from "@/components/JobTable"
import { fetchJobs } from "@/lib/api"

const dummy = [{
    id: "1",
    company: "Tesla",
    title: "Software engineering intern 2025",
    location: "Palo Alto",
    date: "2025-10-14",
    applyStatus: "Applied",
}]

export default async function Home() {
    const jobs = await fetchJobs();

    console.log(jobs)
    return (
        <div className="p-4 flex flex-col gap-8 row-start-2 items-center mx-8">
            <main className="max-w-[1440px] w-full">
                <Navbar />
                <JobTable columns={columns} data={dummy} />
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
            </footer>
        </div>
    );
}
