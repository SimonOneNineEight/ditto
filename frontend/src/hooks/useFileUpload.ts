'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
    getPresignedUploadUrl,
    uploadToS3,
    confirmUpload,
    type FileRecord,
    type UploadProgressEvent,
} from '@/lib/file-service';

export type FileUploadStatus =
    | 'idle'
    | 'uploading'
    | 'confirming'
    | 'completed'
    | 'failed'
    | 'cancelled';

export interface FileUploadState {
    status: FileUploadStatus;
    progress: number;
    bytesUploaded: number;
    totalBytes: number;
    error: string | null;
    estimatedTimeRemaining: number | null;
    speed: number | null;
    fileName: string | null;
}

export interface UseFileUploadOptions {
    applicationId: string;
    interviewId?: string;
    submissionContext?: 'assessment';
    onComplete?: (fileRecord: FileRecord) => void;
}

export interface UseFileUploadReturn extends FileUploadState {
    upload: (file: File) => Promise<void>;
    cancel: () => void;
    retry: () => void;
    reset: () => void;
}

const INITIAL_STATE: FileUploadState = {
    status: 'idle',
    progress: 0,
    bytesUploaded: 0,
    totalBytes: 0,
    error: null,
    estimatedTimeRemaining: null,
    speed: null,
    fileName: null,
};

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
    const { applicationId, interviewId, submissionContext, onComplete } = options;

    const [state, setState] = useState<FileUploadState>(INITIAL_STATE);

    const abortControllerRef = useRef<AbortController | null>(null);
    const fileRef = useRef<File | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const reset = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
        fileRef.current = null;
        setState(INITIAL_STATE);
    }, []);

    const performUpload = useCallback(async (file: File) => {
        fileRef.current = file;
        const controller = new AbortController();
        abortControllerRef.current = controller;
        startTimeRef.current = Date.now();

        setState({
            status: 'uploading',
            progress: 0,
            bytesUploaded: 0,
            totalBytes: file.size,
            error: null,
            estimatedTimeRemaining: null,
            speed: null,
            fileName: file.name,
        });

        try {
            const presigned = await getPresignedUploadUrl(
                file.name,
                file.type,
                file.size,
                applicationId,
                interviewId,
                submissionContext,
            );

            if (controller.signal.aborted) return;

            await uploadToS3(
                presigned.presigned_url,
                file,
                (event: UploadProgressEvent) => {
                    const elapsed = (Date.now() - startTimeRef.current) / 1000;
                    const currentSpeed = elapsed > 0 ? event.loaded / elapsed : 0;
                    const remaining = event.total - event.loaded;
                    const eta = currentSpeed > 0 ? remaining / currentSpeed : null;

                    setState(prev => ({
                        ...prev,
                        progress: event.percent,
                        bytesUploaded: event.loaded,
                        totalBytes: event.total,
                        speed: currentSpeed,
                        estimatedTimeRemaining: file.size > 1024 * 1024 ? eta : null,
                    }));
                },
                controller.signal,
            );

            if (controller.signal.aborted) return;

            setState(prev => ({ ...prev, status: 'confirming', progress: 100 }));

            const fileRecord = await confirmUpload(
                presigned.s3_key,
                file.name,
                file.type,
                file.size,
                applicationId,
                interviewId,
                submissionContext,
            );

            if (controller.signal.aborted) return;

            setState(prev => ({
                ...prev,
                status: 'completed',
                progress: 100,
                estimatedTimeRemaining: null,
            }));

            onComplete?.(fileRecord);
        } catch (err) {
            if (controller.signal.aborted) {
                setState(prev => ({
                    ...prev,
                    status: 'cancelled',
                    error: null,
                    estimatedTimeRemaining: null,
                    speed: null,
                }));
                return;
            }

            setState(prev => ({
                ...prev,
                status: 'failed',
                error: err instanceof Error ? err.message : 'Upload failed',
                estimatedTimeRemaining: null,
                speed: null,
            }));
        }
    }, [applicationId, interviewId, submissionContext, onComplete]);

    const upload = useCallback(async (file: File) => {
        await performUpload(file);
    }, [performUpload]);

    const cancel = useCallback(() => {
        abortControllerRef.current?.abort();
        abortControllerRef.current = null;
    }, []);

    const retry = useCallback(() => {
        if (fileRef.current) {
            performUpload(fileRef.current);
        }
    }, [performUpload]);

    return {
        ...state,
        upload,
        cancel,
        retry,
        reset,
    };
}
