import React from 'react'
import { Button } from "@/components/ui/button"
import Link from 'next/link'

const RegisterButton = () => {
    return (
        <Button>
            <Link href={"/register"}>Register</Link>
        </Button>
    )
}

export default RegisterButton
