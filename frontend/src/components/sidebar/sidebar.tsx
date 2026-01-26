'use client';

import React, { useEffect } from 'react';
import { Suez_One } from 'next/font/google';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Briefcase, LayoutDashboard, Users, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { NavUser } from './nav-user';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

type Props = {};

const suezOne = Suez_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
});

const sidebarMenu = [
    {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'Applications',
        url: '/applications',
        icon: Briefcase,
    },
    {
        title: 'Interviews',
        url: '/interviews',
        icon: Users,
    },
    {
        title: 'Files',
        url: '/files',
        icon: FileText,
    },
];


const AppSidebar = () => {
    const { isMobile, setOpen, toggleSidebar } = useSidebar();
    const side = isMobile ? 'right' : 'left';
    const pathname = usePathname();

    useEffect(() => {
        setOpen(!isMobile);
    }, [isMobile]);

    return (
        <Sidebar side={side}>
            <SidebarHeader className="relative pt-6">
                {isMobile && (
                    <Button
                        variant="ghost"
                        hasIcon
                        iconPosition="only"
                        icon={<X />}
                        onClick={toggleSidebar}
                        className="absolute top-4 left-2"
                    />
                )}
                <Link href="/">
                    <h1 className={suezOne.className + ' text-center pb-2'}>
                        Ditto
                    </h1>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {sidebarMenu.map((item) => {
                        const isActive =
                            item.url === '/'
                                ? pathname === item.url
                                : pathname.startsWith(item.url);
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={isActive}>
                                    <Link href={item.url}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
};

export default AppSidebar;
