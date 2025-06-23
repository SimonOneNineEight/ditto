'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import { SidebarTriggerButton } from '@/components/Sidebar';
import { Menu } from 'lucide-react';

type Props = {
    children: React.ReactNode;
};

const headerMap: Record<string, { h1: string }> = {
    '/': {
        h1: 'Dashboard',
    },
    '/applications': {
        h1: 'Applications',
    },
    '/interviews': {
        h1: 'Interviews',
    },
};

const LayoutWrapper = ({ children }: Props) => {
    const path = usePathname();

    return (
        <div className="flex flex-col gap-8 row-start-2 items-center m-4">
            <main className="w-full max-w-full p-2 flex flex-col gap-6 min-w-0">
                <div className="w-full max-w-full p-2 flex flex-col gap-6 min-w-0">
                    <div>
                        <h1 className="pb-2">
                            {headerMap[path]?.h1 || 'Page'}
                        </h1>
                        <h5>
                            Some Motivating sentence to help people keep going
                        </h5>

                        <SidebarTriggerButton icon={<Menu />} />
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default LayoutWrapper;
