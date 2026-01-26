'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, FileText, Loader2 } from 'lucide-react';
import { type UserFile, formatFileSize, deleteFile } from '@/services/storage-service';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead className="w-24">Size</TableHead>
                        <TableHead className="hidden md:table-cell">Application</TableHead>
                        <TableHead className="hidden sm:table-cell w-28">Uploaded</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {files.map((file) => (
                        <TableRow key={file.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="truncate max-w-[200px]">{file.file_name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {formatFileSize(file.file_size)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground">
                                {file.application_company && file.application_title ? (
                                    <span className="truncate max-w-[200px] block">
                                        {file.application_company} - {file.application_title}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground/50">-</span>
                                )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                                {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(e) => handleDeleteClick(file, e)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete File</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{fileToDelete?.file_name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
