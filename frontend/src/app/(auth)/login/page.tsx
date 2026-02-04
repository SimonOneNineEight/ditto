'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MarketBanner from '../components/market-banner';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import OAuthButtons from '../components/oauth-buttons';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
    const [error, setError] = useState('');

    const onSubmit = async (data: LoginFormData) => {
        const result = await signIn('credentials', {
            email: data.email,
            password: data.password,
            redirect: false,
        });

        if (result?.error) {
            setError('Invalid email or password');
        } else {
            router.push('/');
        }
    };

    return (
        <>
            <MarketBanner variant="login" />
            <div className="flex-1 flex items-center justify-center py-[60px] px-8 lg:px-[120px]">
                <div className="w-full max-w-[400px] flex flex-col gap-6">
                    <div>
                        <h1 className="text-[28px] font-semibold">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-5"
                    >
                        <div>
                            <label className="block text-[11px] uppercase text-muted-foreground tracking-wider mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                {...register('email')}
                                className="w-full px-2 py-1.5 outline-none border-b-2 border-b-border bg-transparent focus:border-primary transition-colors"
                            />
                            {errors.email && (
                                <p className="text-destructive text-sm mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-[11px] uppercase text-muted-foreground tracking-wider mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                {...register('password')}
                                className="w-full px-2 py-1.5 outline-none border-b-2 border-b-border bg-transparent focus:border-primary transition-colors"
                            />
                            {errors.password && (
                                <p className="text-destructive text-sm mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                            <div className="flex justify-end mt-1">
                                <Link
                                    href="#"
                                    className="text-xs text-muted-foreground hover:text-primary"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {error && (
                            <p className="text-destructive text-sm text-center">
                                {error}
                            </p>
                        )}

                        <Button type="submit" size="full">
                            Sign In
                        </Button>
                    </form>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-sm text-muted-foreground">
                            or
                        </span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <OAuthButtons />

                    <p className="text-sm text-center text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link
                            href="/register"
                            className="text-primary hover:underline"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default LoginPage;
