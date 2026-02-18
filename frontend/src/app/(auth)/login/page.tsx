'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import MarketBanner from '../components/market-banner';
import { AUTH_INPUT_CLASS } from '../components/auth-styles';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import OAuthButtons from '../components/oauth-buttons';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
    const [error, setError] = useState('');

    const urlError = searchParams.get('error');
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    useEffect(() => {
        if (urlError === 'SessionExpired') {
            setError('Your session has expired. Please sign in again.');
        }
    }, [urlError]);

    const onSubmit = async (data: LoginFormData) => {
        const result = await signIn('credentials', {
            email: data.email,
            password: data.password,
            redirect: false,
        });

        if (result?.error) {
            setError('Invalid email or password');
        } else {
            router.push(callbackUrl);
        }
    };

    return (
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
                        data-testid="login-form"
                    >
                        <div>
                            <label htmlFor="email" className="block text-[11px] uppercase text-muted-foreground tracking-wider mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                inputMode="email"
                                aria-required="true"
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                                {...register('email')}
                                className={AUTH_INPUT_CLASS}
                                data-testid="login-email"
                            />
                            {errors.email && (
                                <p id="email-error" role="alert" className="text-destructive text-sm mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-[11px] uppercase text-muted-foreground tracking-wider mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                aria-required="true"
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? 'password-error' : undefined}
                                {...register('password')}
                                className={AUTH_INPUT_CLASS}
                                data-testid="login-password"
                            />
                            {errors.password && (
                                <p id="password-error" role="alert" className="text-destructive text-sm mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {error && (
                            <p role="alert" className="text-destructive text-sm text-center">
                                {error}
                            </p>
                        )}

                        <Button type="submit" size="full" data-testid="login-submit">
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
    );
};

const LoginPage = () => {
    return (
        <>
            <MarketBanner variant="login" />
            <div className="flex-1 flex items-center justify-center py-[60px] px-8 lg:px-[120px]">
                <Suspense fallback={<div className="w-full max-w-[400px] h-[400px]" />}>
                    <LoginForm />
                </Suspense>
            </div>
        </>
    );
};

export default LoginPage;
