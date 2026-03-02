'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogBody,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { accountService } from '@/services/account-service';

const setPasswordSchema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type SetPasswordForm = z.infer<typeof setPasswordSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

interface PasswordSectionProps {
    hasPassword: boolean;
}

export function PasswordSection({ hasPassword }: PasswordSectionProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <div className="text-sm font-semibold">Password</div>
                <div className="text-xs text-muted-foreground">
                    {hasPassword
                        ? 'Password is set — click to change it'
                        : 'No password set — click to create one'}
                </div>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                {hasPassword ? 'Change Password' : 'Set Password'}
            </Button>

            {hasPassword ? (
                <ChangePasswordDialog open={dialogOpen} onOpenChange={setDialogOpen} />
            ) : (
                <SetPasswordDialog open={dialogOpen} onOpenChange={setDialogOpen} />
            )}
        </div>
    );
}

function SetPasswordDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SetPasswordForm>({
        resolver: zodResolver(setPasswordSchema),
    });

    const onSubmit = async (data: SetPasswordForm) => {
        setIsSubmitting(true);
        try {
            await accountService.setPassword(data.password);
            toast.success('Password set successfully');
            reset();
            onOpenChange(false);
        } catch {
            // axios interceptor handles error toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) reset();
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[420px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Set Password</DialogTitle>
                        <DialogDescription>
                            Create a password to also log in with your email address.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="set-password">Password</Label>
                            <Input
                                id="set-password"
                                type="password"
                                variant="outline"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="set-confirm">Confirm Password</Label>
                            <Input
                                id="set-confirm"
                                type="password"
                                variant="outline"
                                {...register('confirmPassword')}
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Set Password'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ChangePasswordDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ChangePasswordForm>({
        resolver: zodResolver(changePasswordSchema),
    });

    const onSubmit = async (data: ChangePasswordForm) => {
        setIsSubmitting(true);
        try {
            await accountService.changePassword(data.currentPassword, data.newPassword);
            toast.success('Password changed successfully');
            reset();
            onOpenChange(false);
        } catch {
            // axios interceptor handles error toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) reset();
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[420px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                            Enter your current password and choose a new one.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                variant="outline"
                                {...register('currentPassword')}
                            />
                            {errors.currentPassword && (
                                <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                variant="outline"
                                {...register('newPassword')}
                            />
                            {errors.newPassword && (
                                <p className="text-xs text-destructive">{errors.newPassword.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="change-confirm">Confirm New Password</Label>
                            <Input
                                id="change-confirm"
                                type="password"
                                variant="outline"
                                {...register('confirmPassword')}
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Change Password'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
