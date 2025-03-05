"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

import { useAuth } from "@/contexts/AuthContext"
import UserDrawer from './UserDrawer'

const Authentication = () => {
    const { user } = useAuth();
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

    console.log(user);
    return (
        <div className="flex items-center gap-2">
            {user ?
                <>
                    <UserDrawer isDrawerOpen={isDrawerOpen} setDrawerOpen={setIsDrawerOpen} user={user} />
                </> : <>
                    <Button className="w-20">
                        <Link href={"/login"}>Login</Link>
                    </Button>
                    <Button variant="outline" className="w-20">
                        <Link href={"/register"}>Register</Link>
                    </Button>
                </>}
        </div>
    )
}

export default Authentication
