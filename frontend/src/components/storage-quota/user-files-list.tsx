'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { X, FileText, Loader2 } from 'lucide-react';
import { type UserFile, formatFileSize, deleteFile } from '@/services/storage-service';
import { toast } from 'sonner';

interface UserFilesListProps {
    files: UserFile[];
    isLoading: boolean;
    onFileDeleted: () => void;
}

export function UserFilesList({ files, isLoading, onFileDeleted }: UserFilesListProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<UserFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (file: UserFile, e: React.MouseEvent) => {
        e.stopPropagation();
        setFileToDelete(file);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!fileToDelete) return;

        setIsDeleting(true);
        try {
            await deleteFile(fileToDelete.id);
            toast.success('File deleted successfully');
            onFileDeleted();
        } catch {
            toast.error('Failed to delete file');
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setFileToDelete(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="py-8 text-muted-foreground">
                <p>No files uploaded yet</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                    <div
                        key={file.id}
                        className="rounded-lg border bg-card py-3 px-4 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="text-sm font-medium truncate leading-tight">
                                {file.file_name}
                            </span>
                            <span className="text-xs text-muted-foreground leading-tight">
                                {formatFileSize(file.file_size)}
                            </span>
                        </div>
                        <button
                            onClick={(e) => handleDeleteClick(file, e)}
                            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title="Delete File"
                description={`Are you sure you want to delete "${fileToDelete?.file_name}"? This action cannot be undone.`}
                isDeleting={isDeleting}
                destructive
            />
        </>
    );
}
