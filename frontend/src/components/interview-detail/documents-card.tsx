'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { InterviewDetailCard } from './interview-detail-card';
import { Button } from '@/components/ui/button';
import {
    listFiles,
    deleteFile,
    validateFile,
    getPresignedUploadUrl,
    uploadToS3,
    confirmUpload,
    formatFileSize,
    ALLOWED_EXTENSIONS,
    type FileRecord,
} from '@/lib/file-service';

interface DocumentsCardProps {
    applicationId: string;
    interviewId: string;
}

export const DocumentsCard = ({
    applicationId,
    interviewId,
}: DocumentsCardProps) => {
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchFiles = useCallback(async () => {
        try {
            setIsLoading(true);
            const fetchedFiles = await listFiles(applicationId, interviewId);
            setFiles(fetchedFiles);
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsLoading(false);
        }
    }, [applicationId, interviewId]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleFile = async (file: File) => {
        const validation = validateFile(file);
        if (!validation.valid) {
            toast.error(validation.error || 'Invalid file');
            return;
        }

        setIsUploading(true);
        try {
            const presigned = await getPresignedUploadUrl(
                file.name,
                file.type,
                file.size,
                applicationId,
                interviewId
            );
            await uploadToS3(presigned.presigned_url, file, () => {});
            const fileRecord = await confirmUpload(
                presigned.s3_key,
                file.name,
                file.type,
                file.size,
                applicationId,
                interviewId
            );
            setFiles((prev) => [fileRecord, ...prev]);
            toast.success('File uploaded successfully');
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (fileId: string) => {
        setDeletingId(fileId);
        try {
            await deleteFile(fileId);
            setFiles((prev) => prev.filter((f) => f.id !== fileId));
            toast.success('File deleted');
        } catch {
            // Handled by axios interceptor
        } finally {
            setDeletingId(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            handleFile(droppedFiles[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (selectedFiles && selectedFiles.length > 0) {
            handleFile(selectedFiles[0]);
        }
        e.target.value = '';
    };

    return (
        <InterviewDetailCard title="Interview Documents">
            <div className="space-y-4">
                {/* Dropzone */}
                <label
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`
                        flex flex-col items-center justify-center gap-3 p-8
                        rounded-lg border-2 border-dashed cursor-pointer transition-colors
                        ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}
                        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                    `}
                >
                    <input
                        type="file"
                        accept={ALLOWED_EXTENSIONS.join(',')}
                        onChange={handleInputChange}
                        className="hidden"
                        disabled={isUploading}
                    />
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                        ) : (
                            <Upload className="h-6 w-6 text-muted-foreground" />
                        )}
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium">
                            Drop files here or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            PDF, DOC, DOCX up to 5MB
                        </p>
                    </div>
                </label>

                {/* File List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">
                            No documents uploaded yet
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 py-3 px-4 rounded-lg border bg-card"
                            >
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {file.file_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(file.file_size)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(file.id)}
                                    disabled={deletingId === file.id}
                                >
                                    {deletingId === file.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <X className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </InterviewDetailCard>
    );
};
