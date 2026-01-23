'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './file-upload';
import { FileList } from './file-list';
import { listFiles, type FileRecord } from '@/lib/file-service';
import { Loader2 } from 'lucide-react';

interface DocumentsSectionProps {
    applicationId: string;
    title?: string;
    className?: string;
}

export function DocumentsSection({
    applicationId,
    title = 'Documents',
    className = '',
}: DocumentsSectionProps) {
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const fetchedFiles = await listFiles(applicationId);
            setFiles(fetchedFiles);
        } catch {
            setError('Failed to load files');
        } finally {
            setIsLoading(false);
        }
    }, [applicationId]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleUploadComplete = (file: FileRecord) => {
        setFiles((prev) => [file, ...prev]);
    };

    const handleFileDeleted = (fileId: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
    };

    return (
        <div className={className}>
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
                {title}
            </h3>

            <div className="space-y-4">
                <FileUpload
                    applicationId={applicationId}
                    onUploadComplete={handleUploadComplete}
                    label="Upload Resume or Cover Letter"
                />

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-sm text-destructive text-center py-4">{error}</div>
                ) : (
                    <FileList
                        files={files}
                        onFileDeleted={handleFileDeleted}
                        emptyMessage="No documents uploaded yet"
                    />
                )}
            </div>
        </div>
    );
}

export default DocumentsSection;
