import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const Authentication = () => {
    return (
        <div className="flex items-center gap-2">
            <>
                <Button className="w-18" size="sm">
                    <Link href={'/login'}>Login</Link>
                </Button>
                <Button variant="outline" className="w-18" size="sm">
                    <Link href={'/register'}>Register</Link>
                </Button>
            </>
        </div>
    );
};

export default Authentication;
