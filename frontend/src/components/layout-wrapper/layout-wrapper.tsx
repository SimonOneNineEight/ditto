'use client';

import React from 'react';
import { SidebarTriggerButton } from '@/components/sidebar';
import { Menu } from 'lucide-react';

type Props = {
    children: React.ReactNode;
};

const LayoutWrapper = ({ children }: Props) => {
    return (
        <div className="flex flex-col gap-8 row-start-2 items-center m-4">
            <main className="w-full max-w-full p-2 flex flex-col gap-6 min-w-0">
                <div className="w-full max-w-full p-2 flex flex-col gap-6 min-w-0">
                    <SidebarTriggerButton icon={<Menu />} />
                    {children}
                </div>
            </main>
        </div>
    );
};

export default LayoutWrapper;
