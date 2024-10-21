import Link from "next/link"
import { DarkModeDropdown } from "@/components";
import { Button } from "@/components/ui/button";

const Navbar = () => {
    return (
        <section className="flex justify-between items-center px-4 py-2 mb-8">
            <Link href="/" className="flex items-center gap-2" prefetch={false}>
                <h1 className="text-3xl font-bold">Ditto</h1>
            </Link>
            <div className="flex items-center gap-4">
                <Button>Scrape</Button>
                <DarkModeDropdown />
            </div>
        </section>
    )
}

export default Navbar

