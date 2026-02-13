'use client';

import React from 'react';

type Props = {
    children: React.ReactNode;
};

const LayoutWrapper = ({ children }: Props) => {
    return (
        <div className="flex flex-col row-start-2 items-center px-4 pt-4 sm:px-6 lg:px-8 desktop:pt-0">
            <main className="w-full max-w-[1440px] min-w-0">
                {children}
            </main>
        </div>
    );
};

export default LayoutWrapper;
