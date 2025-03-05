import React from 'react'
import Image from 'next/image';
import { User } from '@/contexts/AuthContext';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTrigger, DrawerClose } from '@/components/ui/drawer';
import { X, LogOut } from 'lucide-react';

interface UserDrawerProps {
    isDrawerOpen: boolean;
    setDrawerOpen: (isOpen: boolean) => void;
    user: User | null;
}

const UserDrawer: React.FC<UserDrawerProps> = ({ isDrawerOpen, setDrawerOpen, user }) => {
    const { logout } = useAuth();
    return (
        <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen} direction="right">
            <DrawerTrigger asChild>
                {
                    user?.avatar_url ? (
                        <Image src={user?.avatar_url} alt={user.name} width={32} height={32} className="rounded-full" />) : (
                        <div className="w-8 h-8 bg-gray-100 text-gray-600 flex items-center justify-center rounded-full font-bold">
                            {user?.name[0].toUpperCase()}
                        </div>)
                }
            </DrawerTrigger>
            <DrawerContent side="right" className="p-2">
                <div className="flex justify-between content-center border-b-gray-600 border-b-2">
                    <DrawerHeader className="flex items-center gap-4">
                        {
                            user?.avatar_url ? (
                                <Image src={user?.avatar_url} alt={user.name} width={32} height={32} className="rounded-full" />) : (
                                <div className="w-8 h-8 bg-gray-100 text-gray-600 flex items-center justify-center rounded-full font-bold">
                                    {user?.name[0].toUpperCase()}
                                </div>)
                        }
                        <h3 className="truncate max-w-[12rem]">
                            {user?.name}
                        </h3>
                    </DrawerHeader>
                    <DrawerClose className="mr-2">
                        <Button variant="ghost" className="p-2 h-auto w-auto"><X className="h-4 w-4" /></Button>
                    </DrawerClose>
                </div>
                <ul className="my-4">
                    <li>
                        <Button onClick={logout} variant="ghost" className="flex gap-2">
                            <LogOut className="h-6 w-6" />
                            <span>Sign out</span>
                        </Button>
                    </li>
                </ul>
            </DrawerContent>
        </Drawer>
    )
}

export default UserDrawer
