'use client';
import { useSession } from 'next-auth/react';
import UserNavControl from './user-nav-control';

const Navbar = () => {
    const { status } = useSession();

    return (
        <>
            {status === 'unauthenticated' ? (
                <section className="flex justify-end items-center px-2 pt-2 mx-2">
                    <div className="flex items-center gap-2">
                        <UserNavControl />

                        {/* <DarkModeDropdown /> */}
                    </div>
                </section>
            ) : null}
        </>
    );
};

export default Navbar;
