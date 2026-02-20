import api from './axios';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ASSESSMENT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for assessment submissions

export const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

export const ASSESSMENT_ALLOWED_FILE_TYPES = [
    ...ALLOWED_FILE_TYPES,
    'application/zip',
    'application/x-zip-compressed',
];
export const ASSESSMENT_ALLOWED_EXTENSIONS = [...ALLOWED_EXTENSIONS, '.zip'];

export interface PresignedUploadResponse {
    presigned_url: string;
    s3_key: string;
    expires_in: number;
}

export interface FileRecord {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    s3_key: string;
    uploaded_at: string;
    created_at: string;
    updated_at: string;
}

export interface FileDownloadResponse {
    presigned_url: string;
    expires_in: number;
    file_name: string;
    file_size: number;
    file_type: string;
}

export interface StorageStats {
    used_bytes: number;
    total_bytes: number;
    file_count: number;
    usage_percentage: number;
    warning: boolean;
    limit_reached: boolean;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size === 0) {
        return { valid: false, error: 'Empty file' };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: 'File too large. Maximum size is 5MB.' };
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return {
                valid: false,
                error: 'Unsupported file type. Allowed: PDF, DOCX, TXT',
            };
        }
    }

    return { valid: true };
}

export function validateAssessmentFile(file: File): {
    valid: boolean;
    error?: string;
} {
    if (file.size === 0) {
        return { valid: false, error: 'Empty file' };
    }

    if (file.size > ASSESSMENT_MAX_FILE_SIZE) {
        return { valid: false, error: 'File too large. Maximum size is 10MB.' };
    }

    if (!ASSESSMENT_ALLOWED_FILE_TYPES.includes(file.type)) {
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
        if (!ASSESSMENT_ALLOWED_EXTENSIONS.includes(ext)) {
            return {
                valid: false,
                error: 'Unsupported file type. Allowed: PDF, DOCX, TXT, ZIP',
            };
        }
    }

    return { valid: true };
}

export async function getPresignedUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    applicationId: string,
    interviewId?: string,
    submissionContext?: 'assessment'
): Promise<PresignedUploadResponse> {
    const response = await api.post('/api/files/presigned-upload', {
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        application_id: applicationId,
        ...(interviewId && { interview_id: interviewId }),
        ...(submissionContext && { submission_context: submissionContext }),
    }, { _suppressToast: true });
    return response.data.data;
}

export interface UploadProgressEvent {
    percent: number;
    loaded: number;
    total: number;
}

export async function uploadToS3(
    presignedUrl: string,
    file: File,
    onProgress?: (event: UploadProgressEvent) => void,
    signal?: AbortSignal,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                onProgress({
                    percent: Math.round((event.loaded / event.total) * 100),
                    loaded: event.loaded,
                    total: event.total,
                });
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
        });

        if (signal) {
            signal.addEventListener('abort', () => xhr.abort());
        }

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });
}

export async function confirmUpload(
    s3Key: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    applicationId: string,
    interviewId?: string,
    submissionContext?: 'assessment'
): Promise<FileRecord> {
    const response = await api.post('/api/files/confirm-upload', {
        s3_key: s3Key,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        application_id: applicationId,
        ...(interviewId && { interview_id: interviewId }),
        ...(submissionContext && { submission_context: submissionContext }),
    }, { _suppressToast: true });
    return response.data.data;
}

export async function listFiles(
    applicationId?: string,
    interviewId?: string
): Promise<FileRecord[]> {
    const params = new URLSearchParams();
    if (applicationId) params.append('application_id', applicationId);
    if (interviewId) params.append('interview_id', interviewId);

    const url = `/api/files${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get(url);
    return response.data.data || [];
}

export async function getFileDownloadUrl(
    fileId: string
): Promise<FileDownloadResponse> {
    const response = await api.get(`/api/files/${fileId}`);
    return response.data.data;
}

export async function deleteFile(fileId: string): Promise<void> {
    await api.delete(`/api/files/${fileId}`);
}

export async function getStorageStats(): Promise<StorageStats> {
    const response = await api.get('/api/users/storage-stats');
    return response.data.data;
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileExtension(fileName: string): string {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    return ext || '';
}
