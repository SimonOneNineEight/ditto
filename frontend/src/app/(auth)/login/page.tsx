'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Suez_One } from 'next/font/google';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const page = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

    const { login } = useAuth();

    const onSubmit = async (data: LoginFormData) => {
        try {
            await login(data.email, data.password);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <div className="w-full h-full flex gap-8 row-start-2 items-center">
                <Card className="flex flex-col justify-center items-center gap-8 w-1/2 h-full m-4 bg-primary/50">
                    <h2 className="text-center">Welcome Back</h2>
                    <h3 className="text-center">
                        {'The Only Place You Need to'}
                        <div>
                            <span>Manage </span>
                            <span className="text-accent bold">
                                Job Applications
                            </span>
                        </div>
                    </h3>
                </Card>
                <Card className="w-84 bg-background border-0 mr-8">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="p-2">
                            <div className="grid w-full items-center gap-2">
                                <div className=" w-full">
                                    <label className="block text-body-large font-bold">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        {...register('email')}
                                        className="w-full mt-1 px-2 py-1  outline-gray-600 border-b-2 border-b-gray-300"
                                    />
                                    {errors.email ? (
                                        <div className={'text-error text-sm'}>
                                            {errors.email.message}
                                        </div>
                                    ) : (
                                        <div className={'h-5'}></div>
                                    )}
                                </div>
                                <div className="w-full mb-4">
                                    <label className="block text-body-large font-bold">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        {...register('password')}
                                        className="w-full mt-1 px-2 py-1  outline-gray-600 border-b-2 border-b-gray-300"
                                    />
                                    {errors.password ? (
                                        <div className={'text-error text-sm'}>
                                            {errors.password.message}
                                        </div>
                                    ) : (
                                        <div className={'h-5'}></div>
                                    )}
                                </div>
                            </div>
                            <CardFooter className="flex-col p-0 pb-4 gap-4">
                                <Button type="submit" size="full">
                                    Login
                                </Button>

                                <Link
                                    href="/register"
                                    className="text-sm text-sky-600"
                                >
                                    Don't have an account? Register here
                                </Link>
                            </CardFooter>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </>
    );
};

export default page;
