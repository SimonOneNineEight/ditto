'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import MarketBanner from '../components/market-banner';
import { Separator } from '@/components/ui/separator';
import { SiGithub } from '@icons-pack/react-simple-icons';
import { signIn } from 'next-auth/react';

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

    const { login, error: authError } = useAuth();

    const onSubmit = async (data: LoginFormData) => {
        await login(data.email, data.password);
    };

    return (
        <div className="w-full h-[80lvh] flex gap-8 row-start-2 items-center">
            <MarketBanner>
                <>
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
                </>
            </MarketBanner>
            <Card className="w-84 bg-background border-0 mr-8">
                <section className="my-4">
                    <Button
                        variant="outline"
                        size="full"
                        hasIcon
                        icon={
                            <SiGithub
                                style={{ width: '1.25rem', height: '1.25rem' }}
                            />
                        }
                        iconPosition="left-center"
                        onClick={() => signIn('github', { redirectTo: '/' })}
                    >
                        Log in with Github
                    </Button>
                </section>
                <Separator />
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
                            <div className="w-full mb-4">
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
                        </div>
                        <CardFooter className="flex-col p-0 pb-4 gap-4">
                            {authError && (
                                <div className="text-error text-sm text-center">
                                    {authError}
                                </div>
                            )}
                            <Button type="submit" size="full">
                                Login
                            </Button>

                            <Link
                                href="/register"
                                className="text-sm link-primary"
                            >
                                Don't have an account? Register here
                            </Link>
                        </CardFooter>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
};

export default page;
