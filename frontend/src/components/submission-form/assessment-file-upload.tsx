'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Loader2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    validateAssessmentFile,
    getPresignedUploadUrl,
    uploadToS3,
    confirmUpload,
    formatFileSize,
    ASSESSMENT_ALLOWED_EXTENSIONS,
} from '@/lib/file-service';
import { toast } from 'sonner';

type UploadStatus = 'idle' | 'validating' | 'uploading' | 'confirming' | 'success' | 'error';

interface AssessmentFileUploadProps {
    applicationId: string;
    onUploadComplete: (fileId: string, fileName: string) => void;
    onFileRemoved: () => void;
    uploadedFileName: string | null;
    disabled?: boolean;
}

export const AssessmentFileUpload = ({
    applicationId,
    onUploadComplete,
    onFileRemoved,
    uploadedFileName,
    disabled = false,
}: AssessmentFileUploadProps) => {
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

            const validation = validateAssessmentFile(file);
            if (!validation.valid) {
                setError(validation.error || 'Invalid file');
                setStatus('error');
                toast.error(validation.error || 'Invalid file');
                return;
            }

            setSelectedFile(file);

            try {
                setStatus('uploading');
                setProgress(0);

                const presigned = await getPresignedUploadUrl(
                    file.name,
                    file.type,
                    file.size,
                    applicationId,
                    undefined,
                    'assessment'
                );

                await uploadToS3(presigned.presigned_url, file, setProgress);

                setStatus('confirming');

                const fileRecord = await confirmUpload(
                    presigned.s3_key,
                    file.name,
                    file.type,
                    file.size,
                    applicationId,
                    undefined,
                    'assessment'
                );

                setStatus('success');
                toast.success('File uploaded');
                onUploadComplete(fileRecord.id, fileRecord.file_name);
            } catch (err) {
                setStatus('error');
                const message = err instanceof Error ? err.message : 'Upload failed';
                setError(message);
                toast.error(message);
            }
        },
        [applicationId, onUploadComplete]
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

            if (disabled || uploadedFileName) return;

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        },
        [disabled, uploadedFileName, handleFile]
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
        if (!disabled && status === 'idle' && !uploadedFileName) {
            inputRef.current?.click();
        }
    }, [disabled, status, uploadedFileName]);

    const handleRemove = useCallback(() => {
        resetState();
        onFileRemoved();
    }, [resetState, onFileRemoved]);

    const isUploading = status === 'uploading' || status === 'confirming';
    const showProgress = isUploading;

    const isZipFile = (fileName: string) => {
        return fileName.toLowerCase().endsWith('.zip');
    };

    if (uploadedFileName) {
        return (
            <div className="flex items-center gap-2.5 rounded-lg border border-border/40 py-2 px-3">
                {isZipFile(uploadedFileName) ? (
                    <Archive className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{uploadedFileName}</p>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleRemove}
                    disabled={disabled}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div>
            <input
                ref={inputRef}
                type="file"
                accept={ASSESSMENT_ALLOWED_EXTENSIONS.join(',')}
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
                `}
            >
                {showProgress ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{selectedFile?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedFile && formatFileSize(selectedFile.size)}
                                    {status === 'confirming' && ' • Confirming...'}
                                </p>
                            </div>
                        </div>

                        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-300 rounded-full bg-secondary"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Upload className="h-8 w-8 text-muted-foreground/60" />
                        <div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Drop files here or click to upload
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                                PDF, DOCX, TXT, ZIP up to 10MB
                            </p>
                        </div>
                    </div>
                )}

                {error && status === 'error' && (
                    <p className="text-xs text-destructive mt-2 text-center">{error}</p>
                )}
            </div>
        </div>
    );
};
