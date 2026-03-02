'use client';

import { useCallback, useEffect, useState } from 'react';
import { SiGithub, SiGoogle } from '@icons-pack/react-simple-icons';
import { Info, Linkedin, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { accountService, type ProviderInfo } from '@/services/account-service';
import { PasswordSection } from './password-section';

const SUPPORTED_PROVIDERS = [
    { id: 'github', name: 'GitHub', icon: SiGithub },
    { id: 'google', name: 'Google', icon: SiGoogle },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
] as const;

export function LinkedProviders() {
    const [providers, setProviders] = useState<ProviderInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [unlinkTarget, setUnlinkTarget] = useState<string | null>(null);

    const hasPassword = providers.some((p) => p.auth_provider === 'local');
    const totalMethods = providers.length;

    const fetchProviders = useCallback(async () => {
        try {
            const data = await accountService.getLinkedProviders();
            setProviders(data);
        } catch {
            // axios interceptor handles error toast
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (!params.get('link_pending')) return;

        window.history.replaceState({}, '', '/settings');

        const match = document.cookie.match(/link_profile=([^;]+)/);
        if (!match) return;

        document.cookie = 'link_profile=; path=/; max-age=0';

        try {
            const profile = JSON.parse(decodeURIComponent(match[1]));
            accountService.linkProvider({
                provider: profile.provider,
                email: profile.email,
                name: profile.name,
                avatar_url: profile.avatar_url,
            }).then(() => {
                toast.success(`${profile.provider} linked successfully`);
                fetchProviders();
            }).catch((error) => {
                const status = (error as { response?: { status?: number } })?.response?.status;
                if (status === 409) {
                    toast.error('This account is already linked to another user');
                } else {
                    toast.error('Failed to link provider');
                }
            });
        } catch {
            toast.error('Failed to link provider');
        }
    }, [fetchProviders]);

    const getProviderInfo = (providerId: string) =>
        providers.find((p) => p.auth_provider === providerId);

    const handleLink = (providerId: string) => {
        document.cookie = `link_mode=${providerId}; path=/; max-age=300; SameSite=Lax`;
        signIn(providerId);
    };

    const handleUnlink = async (providerId: string) => {
        setActionLoading(providerId);
        setUnlinkTarget(null);
        try {
            const data = await accountService.unlinkProvider(providerId);
            setProviders(data);
            toast.success(`${providerId} unlinked successfully`);
        } catch (error) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            if (status === 400) {
                toast.error('Cannot remove your only login method');
            }
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle>Login Methods</CardTitle>
                    <CardDescription>Manage linked providers and password for your account</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle>Login Methods</CardTitle>
                    <CardDescription>Manage linked providers and password for your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {SUPPORTED_PROVIDERS.map((provider) => {
                            const info = getProviderInfo(provider.id);
                            const linked = !!info;
                            const isOnlyMethod = linked && totalMethods <= 1;
                            const isLoading = actionLoading === provider.id;
                            const Icon = provider.icon;

                            return (
                                <div key={provider.id}>
                                    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                                        <div className="flex items-center gap-2.5">
                                            <Icon className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                {provider.name} &bull; {info?.provider_email || (linked ? 'Linked' : 'Not linked')}
                                            </span>
                                        </div>
                                        {linked ? (
                                            isOnlyMethod ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled
                                                            >
                                                                Unlink
                                                            </Button>
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        This is your only login method
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isLoading}
                                                    onClick={() => setUnlinkTarget(provider.id)}
                                                >
                                                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Unlink'}
                                                </Button>
                                            )
                                        ) : (
                                            <Button
                                                size="sm"
                                                disabled={isLoading}
                                                onClick={() => handleLink(provider.id)}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    `Link ${provider.name}`
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                    {isOnlyMethod && (
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs italic text-muted-foreground">
                                                This is your only login method
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-border" />

                    <PasswordSection hasPassword={hasPassword} />
                </CardContent>
            </Card>

            <AlertDialog open={!!unlinkTarget} onOpenChange={() => setUnlinkTarget(null)}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unlink {unlinkTarget}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will no longer be able to sign in with {unlinkTarget}. You can re-link it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => unlinkTarget && handleUnlink(unlinkTarget)}>
                            Unlink
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
