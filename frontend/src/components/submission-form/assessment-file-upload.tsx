'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    validateAssessmentFile,
    ASSESSMENT_ALLOWED_EXTENSIONS,
} from '@/lib/file-service';
import { useFileUpload } from '@/hooks/useFileUpload';
import { UploadProgress } from '@/components/file-upload/upload-progress';
import { toast } from 'sonner';

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
    const [validationError, setValidationError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const uploadState = useFileUpload({
        applicationId,
        submissionContext: 'assessment',
        onComplete: (fileRecord) => {
            toast.success('File uploaded');
            onUploadComplete(fileRecord.id, fileRecord.file_name);
        },
    });

    const isIdle = uploadState.status === 'idle';

    const handleFile = useCallback(
        async (file: File) => {
            setValidationError(null);

            const validation = validateAssessmentFile(file);
            if (!validation.valid) {
                setValidationError(validation.error || 'Invalid file');
                toast.error(validation.error || 'Invalid file');
                return;
            }

            await uploadState.upload(file);
        },
        [uploadState]
    );

    const handleCancel = useCallback(() => {
        uploadState.cancel();
        setTimeout(() => uploadState.reset(), 0);
    }, [uploadState]);

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
        if (!disabled && isIdle && !uploadedFileName) {
            inputRef.current?.click();
        }
    }, [disabled, isIdle, uploadedFileName]);

    const handleRemove = useCallback(() => {
        uploadState.reset();
        onFileRemoved();
    }, [uploadState, onFileRemoved]);

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

    const showUploadProgress = uploadState.status !== 'idle';

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
                    ${validationError ? 'border-destructive/50' : ''}
                `}
            >
                {showUploadProgress && uploadState.fileName ? (
                    <UploadProgress
                        fileName={uploadState.fileName}
                        progress={uploadState.progress}
                        status={uploadState.status}
                        error={uploadState.error}
                        speed={uploadState.speed}
                        estimatedTimeRemaining={uploadState.estimatedTimeRemaining}
                        totalBytes={uploadState.totalBytes}
                        onCancel={handleCancel}
                        onRetry={uploadState.retry}
                    />
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

                {validationError && (
                    <p className="text-xs text-destructive mt-2 text-center" role="alert">
                        {validationError}
                    </p>
                )}
            </div>
        </div>
    );
};
