'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import {
    Github,
    FileText,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Archive,
    Download,
    Trash2,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { type AssessmentSubmission } from '@/services/assessment-service';
import {
    getFileDownloadUrl,
    formatFileSize,
    type FileDownloadResponse,
} from '@/lib/file-service';
import api from '@/lib/axios';

interface SubmissionItemProps {
    submission: AssessmentSubmission;
    onDeleted?: (submissionId: string) => void;
}

const SubmissionItem = ({ submission, onDeleted }: SubmissionItemProps) => {
    const [expanded, setExpanded] = useState(false);
    const [fileDetails, setFileDetails] = useState<FileDownloadResponse | null>(
        null
    );
    const [isLoadingFile, setIsLoadingFile] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isGithub = submission.submission_type === 'github';
    const isFileUpload = submission.submission_type === 'file_upload';
    const isNotes = submission.submission_type === 'notes';

    const hasLongNotes = submission.notes && submission.notes.length > 150;
    const displayNotes =
        expanded || !hasLongNotes
            ? submission.notes
            : `${submission.notes?.slice(0, 150)}...`;

    useEffect(() => {
        if (isFileUpload && submission.file_id) {
            setIsLoadingFile(true);
            getFileDownloadUrl(submission.file_id)
                .then(setFileDetails)
                .catch(() => {
                    // File may have been deleted
                })
                .finally(() => setIsLoadingFile(false));
        }
    }, [isFileUpload, submission.file_id]);

    const handleDownload = async () => {
        if (!submission.file_id) return;

        try {
            const response = await getFileDownloadUrl(submission.file_id);
            window.open(response.presigned_url, '_blank');
        } catch {
            toast.error('Failed to download file');
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/api/assessment-submissions/${submission.id}`);
            toast.success('Submission deleted');
            onDeleted?.(submission.id);
        } catch {
            toast.error('Failed to delete submission');
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    };

    const isZipFile = (fileName: string) => {
        return fileName.toLowerCase().endsWith('.zip');
    };

    const getIcon = () => {
        if (isGithub) return <Github className="h-4 w-4" />;
        if (isFileUpload && fileDetails && isZipFile(fileDetails.file_name)) {
            return <Archive className="h-4 w-4" />;
        }
        return <FileText className="h-4 w-4" />;
    };

    const getLabel = () => {
        if (isGithub) return 'GitHub';
        if (isFileUpload) return 'File Upload';
        return 'Notes';
    };

    return (
        <>
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">
                                    {getLabel()}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                        {format(
                                            parseISO(submission.submitted_at),
                                            'MMM d, yyyy h:mm a'
                                        )}
                                    </span>
                                    {isFileUpload && (
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => setIsDeleteOpen(true)}
                                            className="h-6 w-6"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="mt-1.5">
                                {isGithub && submission.github_url ? (
                                    <a
                                        href={submission.github_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
                                    >
                                        {submission.github_url}
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    </a>
                                ) : isFileUpload ? (
                                    isLoadingFile ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Loading file...
                                        </div>
                                    ) : fileDetails ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleDownload}
                                                className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 hover:underline"
                                            >
                                                {fileDetails.file_name}
                                                <Download className="h-3 w-3 flex-shrink-0" />
                                            </button>
                                            <span className="text-xs text-muted-foreground">
                                                ({formatFileSize(fileDetails.file_size)})
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground/60 italic">
                                            File not available
                                        </span>
                                    )
                                ) : isNotes ? (
                                    <>
                                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                                            {displayNotes}
                                        </p>
                                        {hasLongNotes && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                                                onClick={() =>
                                                    setExpanded(!expanded)
                                                }
                                            >
                                                {expanded ? (
                                                    <>
                                                        Show less{' '}
                                                        <ChevronUp className="ml-1 h-3 w-3" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Show more{' '}
                                                        <ChevronDown className="ml-1 h-3 w-3" />
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <DeleteConfirmDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                onConfirm={handleDelete}
                title="Delete Submission"
                description="Are you sure you want to delete this file submission? This action cannot be undone."
                isDeleting={isDeleting}
                destructive
            />
        </>
    );
};

interface SubmissionListProps {
    submissions: AssessmentSubmission[];
    onSubmissionDeleted?: (submissionId: string) => void;
}

export const SubmissionList = ({
    submissions,
    onSubmissionDeleted,
}: SubmissionListProps) => {
    if (submissions.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-muted-foreground">
                No submissions yet
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {submissions.map((submission) => (
                <SubmissionItem
                    key={submission.id}
                    submission={submission}
                    onDeleted={onSubmissionDeleted}
                />
            ))}
        </div>
    );
};
