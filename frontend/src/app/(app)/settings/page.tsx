'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { NotificationPreferences } from '@/components/notification-center';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Shield, Cloud, Database, Loader2, HardDriveDownload } from 'lucide-react';
import { ExportDialog } from '@/components/export-dialog';
import { toast } from 'sonner';
import { exportFullBackup } from '@/services/exportService';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';

export default function SettingsPage() {
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [isExportingBackup, setIsExportingBackup] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const handleFullBackup = async () => {
        setIsExportingBackup(true);
        try {
            await exportFullBackup();
            toast.success('Full backup downloaded successfully');
        } catch (error) {
            console.error('Backup failed:', error);
            toast.error('Failed to download backup. Please try again.');
        } finally {
            setIsExportingBackup(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Settings"
                subtitle="Manage your account and preferences"
            />

            <section className="flex w-full flex-col gap-6">
                <NotificationPreferences />

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-[18px] w-[18px]" />
                            Data & Privacy
                        </CardTitle>
                        <CardDescription>
                            Backup policies, data export, and retention information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-start gap-2.5">
                                <Cloud className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="space-y-0.5">
                                    <div className="font-medium text-sm">Data Security</div>
                                    <div className="text-sm text-muted-foreground">
                                        Your data is stored securely. Download a full backup anytime using the options below.
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5">
                                <Database className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="space-y-0.5">
                                    <div className="font-medium text-sm">Data Retention</div>
                                    <div className="text-sm text-muted-foreground">
                                        Your data is retained indefinitely while your account is active
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            <Button
                                variant="outline"
                                onClick={() => setExportDialogOpen(true)}
                            >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Export CSV
                            </Button>
                            <Button
                                onClick={handleFullBackup}
                                disabled={isExportingBackup}
                            >
                                {isExportingBackup ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                        Preparing...
                                    </>
                                ) : (
                                    <>
                                        <HardDriveDownload className="h-3.5 w-3.5 mr-1.5" />
                                        Download Full Backup (JSON)
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="font-medium text-sm">Delete account</div>
                                <div className="text-xs text-muted-foreground">
                                    Permanently delete your account and all data
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => setDeleteDialogOpen(true)}
                                className="w-full sm:w-auto"
                            >
                                Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <ExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
            />

            <DeleteAccountDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    );
}
