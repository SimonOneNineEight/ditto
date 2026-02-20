'use client';

import React, { useState } from 'react';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import api from '@/lib/axios';

const CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

interface DeleteAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const isConfirmationValid = confirmationText === CONFIRMATION_PHRASE;

    const handleClose = () => {
        setStep(1);
        setConfirmationText('');
        onOpenChange(false);
    };

    const handleNextStep = () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2 && isConfirmationValid) {
            setStep(3);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await api.delete('/api/users/account');
            toast.success('Account deleted successfully');
            handleClose();
            await signOut({ callbackUrl: '/login?message=account_deleted' });
        } catch (error) {
            console.error('Failed to delete account:', error);
            setIsDeleting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Account
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-left">
                                <div className="space-y-4 pt-2">
                                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
                                        <p className="font-medium text-destructive mb-2">
                                            This action is irreversible
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Deleting your account will permanently remove all your data, including:
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                                            <li>All job applications and their details</li>
                                            <li>All interview records, notes, and questions</li>
                                            <li>All technical assessments and submissions</li>
                                            <li>All uploaded files (resumes, cover letters, etc.)</li>
                                            <li>All notifications and preferences</li>
                                        </ul>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        We recommend downloading a full backup of your data before proceeding.
                                    </p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
                            <Button variant="destructive" onClick={handleNextStep}>
                                I understand, continue
                            </Button>
                        </AlertDialogFooter>
                    </>
                );

            case 2:
                return (
                    <>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Confirm Deletion
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-left">
                                <div className="space-y-4 pt-2">
                                    <p className="text-sm text-muted-foreground">
                                        To confirm account deletion, please type{' '}
                                        <span className="font-mono font-bold text-foreground">
                                            {CONFIRMATION_PHRASE}
                                        </span>{' '}
                                        below:
                                    </p>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmation">Confirmation</Label>
                                        <Input
                                            id="confirmation"
                                            value={confirmationText}
                                            onChange={(e) => setConfirmationText(e.target.value)}
                                            placeholder="Type the confirmation phrase"
                                            className={
                                                confirmationText && !isConfirmationValid
                                                    ? 'border-destructive focus-visible:ring-destructive'
                                                    : ''
                                            }
                                        />
                                        {confirmationText && !isConfirmationValid && (
                                            <p className="text-xs text-destructive">
                                                The phrase doesn&apos;t match. Please type it exactly.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
                            <Button
                                variant="destructive"
                                onClick={handleNextStep}
                                disabled={!isConfirmationValid}
                            >
                                Continue to final confirmation
                            </Button>
                        </AlertDialogFooter>
                    </>
                );

            case 3:
                return (
                    <>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Final Confirmation
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-left">
                                <div className="space-y-4 pt-2">
                                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-4">
                                        <p className="font-medium text-destructive">
                                            You are about to permanently delete your account
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            This action cannot be undone. All your data will be permanently deleted and you will be logged out immediately.
                                        </p>
                                    </div>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
                                Cancel
                            </AlertDialogCancel>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Permanently Delete Account'
                                )}
                            </Button>
                        </AlertDialogFooter>
                    </>
                );
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="sm:max-w-md">
                {renderStep()}
            </AlertDialogContent>
        </AlertDialog>
    );
}
