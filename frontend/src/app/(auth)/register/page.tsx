"use client"

import React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from "zod"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

const registerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required")
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

const page = () => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

    const { register: registerUser } = useAuth();

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await registerUser(data.name, data.email, data.password);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="p-4 flex flex-col gap-8 row-start-2 items-center mx-8">
            <h1 className="text-2xl pt-6 font-semibold">Register to Ditto</h1>
            <Card className="w-84">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <CardContent className="p-6">
                        <div className="grid w-full items-center gap-2">
                            <div className="w-full">
                                <label className="block">
                                    Name
                                </label>
                                <input
                                    {...register("name")}
                                    className="w-full mt-1 px-2 py-1  outline-gray-600 border-b-2 border-b-gray-300"
                                />
                                {errors.name ? <p className={"text-red-500 text-sm"}>{errors.name.message}</p> : <p className={"h-5"}></p>}
                            </div>

                            <div className=" w-full">
                                <label className="block">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    {...register("email")}
                                    className="w-full mt-1 px-2 py-1  outline-gray-600 border-b-2 border-b-gray-300"
                                />
                                {errors.email ? <p className={"text-red-500 text-sm"}>{errors.email.message}</p> : <p className={"h-5"}></p>}
                            </div>
                            <div className=" w-full">
                                <label className="block">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    {...register("password")}
                                    className="w-full mt-1 px-2 py-1  outline-gray-600 border-b-2 border-b-gray-300"
                                />
                                {errors.password ? <p className={"text-red-500 text-sm"}>{errors.password.message}</p> : <p className={"h-5"}></p>}
                            </div>
                            <div className="w-full mb-4">
                                <label className="block">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    {...register("confirmPassword")}
                                    className="w-full mt-1 px-2 py-1  outline-gray-600 border-b-2 border-b-gray-300"
                                />
                                {errors.confirmPassword ? <p className={"text-red-500 text-sm"}>{errors.confirmPassword.message}</p> : <p className={"h-5"}></p>}
                            </div>
                        </div>
                        <CardFooter className="flex-col gap-4 p-0 pb-4">
                            <Button
                                type="submit"
                                className="w-full bg-sky-600 text-white font-bold">
                                Register
                            </Button>
                            <Link href="/login" className="text-sm text-sky-600">Already have an account? Login here</Link>
                        </CardFooter>
                    </CardContent>
                </form>
            </Card>
        </div>
    )
}

export default page
