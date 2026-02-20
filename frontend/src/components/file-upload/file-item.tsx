'use client';

import { useState } from 'react';
import { Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    getFileDownloadUrl,
    deleteFile,
    formatFileSize,
    getFileExtension,
    type FileRecord,
} from '@/lib/file-service';
import { UploadProgress } from './upload-progress';
import type { FileUploadStatus } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

export interface FileItemUploadState {
    status: FileUploadStatus;
    progress: number;
    error: string | null;
    speed: number | null;
    estimatedTimeRemaining: number | null;
    totalBytes: number;
    onCancel: () => void;
    onRetry: () => void;
}

interface FileItemProps {
    file: FileRecord;
    onDeleted?: (fileId: string) => void;
    uploadState?: FileItemUploadState;
}

const FILE_ICONS: Record<string, string> = {
    '.pdf': 'PDF',
    '.docx': 'DOC',
    '.txt': 'TXT',
};

export function FileItem({ file, onDeleted, uploadState }: FileItemProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const ext = getFileExtension(file.file_name);
    const iconLabel = FILE_ICONS[ext] || 'FILE';

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            const { presigned_url } = await getFileDownloadUrl(file.id);
            window.open(presigned_url, '_blank');
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            await deleteFile(file.id);
            toast.success('File deleted');
            setShowDeleteDialog(false);
            onDeleted?.(file.id);
        } catch {
            // Handled by axios interceptor
        } finally {
            setIsDeleting(false);
        }
    };

    if (uploadState && uploadState.status !== 'idle' && uploadState.status !== 'completed') {
        return (
            <div className="py-2 px-3 rounded-md">
                <UploadProgress
                    fileName={file.file_name}
                    progress={uploadState.progress}
                    status={uploadState.status}
                    error={uploadState.error}
                    speed={uploadState.speed}
                    estimatedTimeRemaining={uploadState.estimatedTimeRemaining}
                    totalBytes={uploadState.totalBytes}
                    onCancel={uploadState.onCancel}
                    onRetry={uploadState.onRetry}
                />
            </div>
        );
    }

    return (
        <>
            <div className="group flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/20 transition-colors">
                <div className="flex-shrink-0 w-9 h-9 rounded bg-muted/40 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                        {iconLabel}
                    </span>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.file_size)}
                    </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={handleDownload}
                        disabled={isDownloading}
                    >
                        {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setShowDeleteDialog(true)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete this file?</DialogTitle>
                        <DialogDescription>
                            &quot;{file.file_name}&quot; will be permanently deleted. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default FileItem;
