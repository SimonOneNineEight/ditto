import api from '@/lib/axios';

export interface StorageStats {
    used_bytes: number;
    total_bytes: number;
    file_count: number;
    usage_percentage: number;
    warning: boolean;
    limit_reached: boolean;
}

export interface UserFile {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    application_id: string;
    uploaded_at: string;
    application_company?: string;
    application_title?: string;
}

export async function getStorageStats(): Promise<StorageStats> {
    const response = await api.get('/api/users/storage-stats');
    return response.data?.data;
}

export async function getUserFiles(sortBy: string = 'file_size'): Promise<UserFile[]> {
    const response = await api.get(`/api/users/files?sort_by=${sortBy}`);
    return response.data?.data?.files || [];
}

export async function deleteFile(fileId: string): Promise<void> {
    await api.delete(`/api/files/${fileId}`);
}

export function canUploadFile(stats: StorageStats, fileSizeBytes: number): boolean {
    return stats.used_bytes + fileSizeBytes <= stats.total_bytes;
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function bytesToMB(bytes: number): number {
    return Math.round(bytes / (1024 * 1024));
}
