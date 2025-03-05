import Link from "next/link"
import DarkModeDropdown from "./DarkModeDropdown"
import UserNavControl from "./UserNavControl"

const Navbar = () => {

    return (
        <section className="flex justify-between items-center px-2 py-2">
            <Link href="/" className="flex items-center gap-2" prefetch={false}>
                <h1 className="text-3xl font-bold">Ditto</h1>
            </Link>
            <div className="flex items-center gap-2">
                <UserNavControl />

                {/* <DarkModeDropdown /> */}
            </div>
        </section>
    )
}

export default Navbar

