'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { StorageQuotaWidget } from '@/components/storage-quota/storage-quota-widget';
import { UserFilesList } from '@/components/storage-quota/user-files-list';
import { FileUpload, type FileUploadHandle } from '@/components/file-upload/file-upload';
import {
    getStorageStats,
    getUserFiles,
    type StorageStats,
    type UserFile,
} from '@/services/storage-service';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FilesPage() {
    const fileUploadRef = useRef<FileUploadHandle>(null);
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
                subtitle="Manage your resumes, cover letters, and other documents"
                actions={
                    <Button size="sm" onClick={() => fileUploadRef.current?.trigger()}>
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                    </Button>
                }
            />

            <section className="min-w-0 space-y-6">
                {isLoadingStats ? (
                    <div className="flex items-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : stats ? (
                    <StorageQuotaWidget stats={stats} />
                ) : null}

                <FileUpload
                    ref={fileUploadRef}
                    onFileSelect={() => {}}
                    className="w-full"
                />

                <div>
                    <h2 className="text-lg font-semibold mb-4">Your Files</h2>
                    <UserFilesList
                        files={files}
                        isLoading={isLoadingFiles}
                        onFileDeleted={handleFileDeleted}
                    />
                </div>
            </section>
        </>
    );
}
