'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    validateFile,
    getPresignedUploadUrl,
    uploadToS3,
    confirmUpload,
    formatFileSize,
    ALLOWED_EXTENSIONS,
    type FileRecord,
} from '@/lib/file-service';
import { toast } from 'sonner';

export type UploadStatus =
    | 'idle'
    | 'validating'
    | 'uploading'
    | 'confirming'
    | 'success'
    | 'error';

interface FileUploadProps {
    applicationId?: string;
    onUploadComplete?: (file: FileRecord) => void;
    onFileSelect?: (file: File) => void;
    disabled?: boolean;
    label?: string;
    className?: string;
    interviewId?: string;
}

export function FileUpload({
    applicationId,
    onUploadComplete,
    onFileSelect,
    disabled = false,
    label,
    className = '',
    interviewId = '',
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setStatus('idle');
        setProgress(0);
        setSelectedFile(null);
        setError(null);
    }, []);

    const handleFile = useCallback(
        async (file: File) => {
            setError(null);
            setStatus('validating');

            const validation = validateFile(file);
            if (!validation.valid) {
                setError(validation.error || 'Invalid file');
                setStatus('error');
                toast.error(validation.error || 'Invalid file');
                return;
            }

            setSelectedFile(file);

            if (onFileSelect) {
                onFileSelect(file);
                setStatus('idle');
                return;
            }

            if (!applicationId) {
                setStatus('idle');
                return;
            }

            try {
                setStatus('uploading');
                setProgress(0);

                const presigned = await getPresignedUploadUrl(
                    file.name,
                    file.type,
                    file.size,
                    applicationId,
                    interviewId
                );

                await uploadToS3(presigned.presigned_url, file, setProgress);

                setStatus('confirming');

                const fileRecord = await confirmUpload(
                    presigned.s3_key,
                    file.name,
                    file.type,
                    file.size,
                    applicationId,
                    interviewId
                );

                setStatus('success');
                toast.success('File uploaded successfully');

                if (onUploadComplete) {
                    onUploadComplete(fileRecord);
                }

                setTimeout(resetState, 2000);
            } catch (err) {
                setStatus('error');
                const message =
                    err instanceof Error ? err.message : 'Upload failed';
                setError(message);
                toast.error(message);
            }
        },
        [applicationId, interviewId, onFileSelect, onUploadComplete, resetState]
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled) {
                setIsDragging(true);
            }
        },
        [disabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (disabled) return;

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        },
        [disabled, handleFile]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        },
        [handleFile]
    );

    const handleClick = useCallback(() => {
        if (!disabled && status === 'idle') {
            inputRef.current?.click();
        }
    }, [disabled, status]);

    const handleCancel = useCallback(() => {
        resetState();
    }, [resetState]);

    const isUploading = status === 'uploading' || status === 'confirming';
    const showProgress = isUploading || status === 'success';

    return (
        <div className={className}>
            <input
                ref={inputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled}
            />

            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative rounded-lg border-2 border-dashed p-6 transition-all cursor-pointer
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-border/40 hover:border-border'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${status === 'error' ? 'border-destructive/50' : ''}
                    ${status === 'success' ? 'border-accent/50 bg-accent/5' : ''}
                `}
            >
                {showProgress ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            {status === 'success' ? (
                                <FileText className="h-5 w-5 text-accent" />
                            ) : (
                                <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">
                                    {selectedFile?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedFile &&
                                        formatFileSize(selectedFile.size)}
                                    {status === 'confirming' &&
                                        ' • Confirming...'}
                                    {status === 'success' && ' • Uploaded'}
                                </p>
                            </div>
                            {isUploading && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancel();
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 rounded-full ${
                                    status === 'success'
                                        ? 'bg-accent'
                                        : 'bg-secondary'
                                }`}
                                style={{
                                    width: `${status === 'success' ? 100 : progress}%`,
                                }}
                            />
                        </div>
                    </div>
                ) : selectedFile && !applicationId ? (
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(selectedFile.size)} • Ready to
                                upload
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                resetState();
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Upload className="h-8 w-8 text-muted-foreground/60" />
                        <div>
                            {label && <p className="text-sm font-medium">{label}</p>}
                            <p className="text-xs text-muted-foreground mt-1">
                                Drop files here or click to upload
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                                PDF, DOCX, TXT up to 5MB
                            </p>
                        </div>
                    </div>
                )}

                {error && status === 'error' && (
                    <p className="text-xs text-destructive mt-2 text-center">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}

export default FileUpload;
