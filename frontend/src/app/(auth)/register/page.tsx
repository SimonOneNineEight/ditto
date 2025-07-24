'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import MarketBanner from '../components/marketBanner';

const registerSchema = z
    .object({
        name: z.string().min(2, 'Name is required'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(8, 'Confirm password is required'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

const page = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

    const { register: registerUser, error: authError } = useAuth();

    const onSubmit = async (data: RegisterFormData) => {
        await registerUser(data.name, data.email, data.password);
    };

    return (
        <div className="w-full h-[80lvh] flex gap-8 row-start-2 items-center">
            <MarketBanner>
                <>
                    <h2 className="text-center">Join Ditto</h2>
                    <h3 className="text-center">
                        {'Start Manage Your'}
                        <div className="text-accent bold">Job Applications</div>
                        {'With Only One Website'}
                    </h3>
                </>
            </MarketBanner>
            <Card className="w-84 bg-background border-0 mr-8">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="p-2">
                        <div className="grid w-full items-center gap-2">
                            <div className=" w-full">
                                <label className="block text-body-large font-bold">
                                    Name
                                </label>
                                <input
                                    {...register('name')}
                                    className="w-full mt-1 px-2 py-1 outline-none border-b-2 border-b-gray-300 focus:border-primary"
                                />
                                {errors.name ? (
                                    <div className={'text-error text-sm'}>
                                        {errors.name.message}
                                    </div>
                                ) : (
                                    <div className={'h-5'}></div>
                                )}
                            </div>

                            <div className=" w-full">
                                <label className="block text-body-large font-bold">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    {...register('email')}
                                    className="w-full mt-1 px-2 py-1 outline-none border-b-2 border-b-gray-300 focus:border-primary"
                                />
                                {errors.email ? (
                                    <div className={'text-error text-sm'}>
                                        {errors.email.message}
                                    </div>
                                ) : (
                                    <div className={'h-5'}></div>
                                )}
                            </div>
                            <div className=" w-full">
                                <label className="block text-body-large font-bold">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    {...register('password')}
                                    className="w-full mt-1 px-2 py-1 outline-none border-b-2 border-b-gray-300 focus:border-primary"
                                />
                                {errors.password ? (
                                    <div className={'text-error text-sm'}>
                                        {errors.password.message}
                                    </div>
                                ) : (
                                    <div className={'h-5'}></div>
                                )}
                            </div>
                            <div className="w-full mb-4">
                                <label className="block text-body-large font-bold">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    {...register('confirmPassword')}
                                    className="w-full mt-1 px-2 py-1 outline-none border-b-2 border-b-gray-300 focus:border-primary"
                                />
                                {errors.confirmPassword ? (
                                    <div className={'text-error text-sm'}>
                                        {errors.confirmPassword.message}
                                    </div>
                                ) : (
                                    <div className={'h-5'}></div>
                                )}
                            </div>
                        </div>
                        <CardFooter className="flex-col gap-4 p-0 pb-4">
                            {authError && (
                                <div className="text-error text-sm text-center">
                                    {authError}
                                </div>
                            )}
                            <Button type="submit" size="full">
                                Register
                            </Button>
                            <Link
                                href="/login"
                                className="text-sm link-primary"
                            >
                                Already have an account? Login here
                            </Link>
                        </CardFooter>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
};

export default page;
