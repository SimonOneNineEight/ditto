'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import MarketBanner from '../components/market-banner';
import { AUTH_INPUT_CLASS } from '../components/auth-styles';
import { authService } from '@/services/auth-service';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import OAuthButtons from '../components/oauth-buttons';

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

const RegisterPage = () => {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

    const [error, setError] = useState('');

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await authService.register(data.name, data.email, data.password);

            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setError(
                    'Registration successful but login failed. Please try logging in.'
                );
            } else {
                router.push('/');
            }
        } catch {
            setError('Registration failed. Please try again.');
        }
    };

    return (
        <>
            <MarketBanner variant="register" />
            <div className="flex-1 flex items-center justify-center py-[60px] px-8 lg:px-[120px]">
                <div className="w-full max-w-[400px] flex flex-col gap-6">
                    <div>
                        <h1 className="text-[28px] font-semibold">
                            Create account
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Fill in your details to get started
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-5"
                        data-testid="register-form"
                    >
                        <div>
                            <label htmlFor="name" className="block text-[11px] uppercase text-muted-foreground tracking-wider mb-1">
                                Name
                            </label>
                            <input
                                id="name"
                                autoComplete="name"
                                aria-required="true"
                                aria-invalid={!!errors.name}
                                aria-describedby={errors.name ? 'name-error' : undefined}
                                {...register('name')}
                                className={AUTH_INPUT_CLASS}
                                data-testid="register-name"
                            />
                            {errors.name && (
                                <p id="name-error" role="alert" className="text-destructive text-sm mt-1">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

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
                                aria-describedby={errors.email ? 'reg-email-error' : undefined}
                                {...register('email')}
                                className={AUTH_INPUT_CLASS}
                                data-testid="register-email"
                            />
                            {errors.email && (
                                <p id="reg-email-error" role="alert" className="text-destructive text-sm mt-1">
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
                                autoComplete="new-password"
                                aria-required="true"
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? 'reg-password-error' : undefined}
                                {...register('password')}
                                className={AUTH_INPUT_CLASS}
                                data-testid="register-password"
                            />
                            {errors.password && (
                                <p id="reg-password-error" role="alert" className="text-destructive text-sm mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-[11px] uppercase text-muted-foreground tracking-wider mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                aria-required="true"
                                aria-invalid={!!errors.confirmPassword}
                                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                                {...register('confirmPassword')}
                                className={AUTH_INPUT_CLASS}
                                data-testid="register-confirm-password"
                            />
                            {errors.confirmPassword && (
                                <p id="confirm-password-error" role="alert" className="text-destructive text-sm mt-1">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {error && (
                            <p role="alert" className="text-destructive text-sm text-center">
                                {error}
                            </p>
                        )}

                        <Button type="submit" size="full" data-testid="register-submit">
                            Create Account
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
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-primary hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
};

export default RegisterPage;
