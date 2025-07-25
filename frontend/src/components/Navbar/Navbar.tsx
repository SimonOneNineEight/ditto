'use client';
import { useAuth } from '@/contexts/auth-context';
import UserNavControl from './user-nav-control';

const Navbar = () => {
    const { user } = useAuth();

    return (
        <>
            {user ? null : (
                <section className="flex justify-end items-center px-2 pt-2 mx-2">
                    <div className="flex items-center gap-2">
                        <UserNavControl />

                        {/* <DarkModeDropdown /> */}
                    </div>
                </section>
            )}
        </>
    );
};

export default Navbar;
