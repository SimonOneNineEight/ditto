'use client';

import { FileText } from 'lucide-react';
import { FileItem } from './file-item';
import { type FileRecord } from '@/lib/file-service';

interface FileListProps {
    files: FileRecord[];
    onFileDeleted?: (fileId: string) => void;
    emptyMessage?: string;
    className?: string;
}

export function FileList({
    files,
    onFileDeleted,
    emptyMessage = 'No files uploaded',
    className = '',
}: FileListProps) {
    if (files.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
                <FileText className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className={`space-y-1 ${className}`}>
            {files.map((file) => (
                <FileItem
                    key={file.id}
                    file={file}
                    onDeleted={onFileDeleted}
                />
            ))}
        </div>
    );
}

export default FileList;
