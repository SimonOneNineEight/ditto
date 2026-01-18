'use client';
import React from 'react';
import { useSidebar } from '../ui/sidebar';
import { Button } from '@/components/ui/button';

type Props = {
    icon: React.ReactNode;
};

const SidebarTriggerButton = ({ icon }: Props) => {
    const { isMobile, toggleSidebar } = useSidebar();

    return isMobile ? (
        <Button
            variant="ghost"
            hasIcon
            iconPosition="only"
            icon={icon}
            onClick={toggleSidebar}
        />
    ) : null;
};

export default SidebarTriggerButton;
