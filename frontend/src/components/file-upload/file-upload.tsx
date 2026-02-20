'use client';

import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    validateFile,
    formatFileSize,
    ALLOWED_EXTENSIONS,
    type FileRecord,
} from '@/lib/file-service';
import { useFileUpload } from '@/hooks/useFileUpload';
import { UploadProgress } from './upload-progress';
import { toast } from 'sonner';

export interface FileUploadHandle {
    trigger: () => void;
}

interface FileUploadProps {
    applicationId?: string;
    onUploadComplete?: (file: FileRecord) => void;
    onFileSelect?: (file: File) => void;
    disabled?: boolean;
    label?: string;
    className?: string;
    interviewId?: string;
}

export const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(function FileUpload({
    applicationId,
    onUploadComplete,
    onFileSelect,
    disabled = false,
    label,
    className = '',
    interviewId = '',
}, ref) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const uploadState = useFileUpload({
        applicationId: applicationId || '',
        interviewId: interviewId || undefined,
        onComplete: (fileRecord) => {
            toast.success('File uploaded successfully');
            onUploadComplete?.(fileRecord);
            setTimeout(() => {
                uploadState.reset();
                setSelectedFile(null);
            }, 2000);
        },
    });

    const isIdle = uploadState.status === 'idle';

    useImperativeHandle(ref, () => ({
        trigger() {
            if (!disabled && isIdle) {
                inputRef.current?.click();
            }
        },
    }), [disabled, isIdle]);

    const handleFile = useCallback(
        async (file: File) => {
            setValidationError(null);

            const validation = validateFile(file);
            if (!validation.valid) {
                setValidationError(validation.error || 'Invalid file');
                toast.error(validation.error || 'Invalid file');
                return;
            }

            setSelectedFile(file);

            if (onFileSelect) {
                onFileSelect(file);
                return;
            }

            if (!applicationId) {
                return;
            }

            await uploadState.upload(file);
        },
        [applicationId, onFileSelect, uploadState]
    );

    const handleCancel = useCallback(() => {
        uploadState.cancel();
        setTimeout(() => {
            uploadState.reset();
            setSelectedFile(null);
        }, 0);
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
        if (!disabled && isIdle) {
            inputRef.current?.click();
        }
    }, [disabled, isIdle]);

    const showUploadProgress = uploadState.status !== 'idle';

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
                    ${validationError ? 'border-destructive/50' : ''}
                    ${uploadState.status === 'completed' ? 'border-accent/50 bg-accent/5' : ''}
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
                ) : selectedFile && !applicationId ? (
                    <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(selectedFile.size)} · Ready to
                                upload
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                setValidationError(null);
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

                {validationError && (
                    <p className="text-xs text-destructive mt-2 text-center" role="alert">
                        {validationError}
                    </p>
                )}
            </div>
        </div>
    );
});

export default FileUpload;
