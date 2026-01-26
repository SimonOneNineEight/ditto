'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { StorageQuotaWidget } from '@/components/storage-quota/storage-quota-widget';
import { UserFilesList } from '@/components/storage-quota/user-files-list';
import {
    getStorageStats,
    getUserFiles,
    type StorageStats,
    type UserFile,
} from '@/services/storage-service';
import { Loader2 } from 'lucide-react';

export default function FilesPage() {
    const [stats, setStats] = useState<StorageStats | null>(null);
    const [files, setFiles] = useState<UserFile[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingFiles, setIsLoadingFiles] = useState(true);

    const fetchStorageStats = useCallback(async () => {
        try {
            const data = await getStorageStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch storage stats:', error);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    const fetchFiles = useCallback(async () => {
        try {
            const data = await getUserFiles('file_size');
            setFiles(data);
        } catch (error) {
            console.error('Failed to fetch files:', error);
        } finally {
            setIsLoadingFiles(false);
        }
    }, []);

    useEffect(() => {
        fetchStorageStats();
        fetchFiles();
    }, [fetchStorageStats, fetchFiles]);

    const handleFileDeleted = () => {
        fetchStorageStats();
        fetchFiles();
    };

    return (
        <>
            <PageHeader
                title="Files"
                subtitle="Manage your uploaded documents"
            />

            <section className="min-w-0">
                {isLoadingStats ? (
                    <div className="flex items-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : stats ? (
                    <StorageQuotaWidget stats={stats} className="mb-6" />
                ) : null}

                <UserFilesList
                    files={files}
                    isLoading={isLoadingFiles}
                    onFileDeleted={handleFileDeleted}
                />
            </section>
        </>
    );
}
