'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    createSubmission,
    SUBMISSION_TYPE_OPTIONS,
    type AssessmentSubmission,
} from '@/services/assessment-service';
import { AssessmentFileUpload } from './assessment-file-upload';

const formSchema = z
    .object({
        submission_type: z.enum(['github', 'file_upload', 'notes'], {
            required_error: 'Please select a submission type',
        }),
        github_url: z.string().optional(),
        file_id: z.string().optional(),
        notes: z.string().optional(),
    })
    .refine(
        (data) => {
            if (data.submission_type === 'github') {
                return (
                    data.github_url &&
                    data.github_url.trim() !== '' &&
                    (data.github_url.startsWith('http://') ||
                        data.github_url.startsWith('https://'))
                );
            }
            return true;
        },
        {
            message: 'Please enter a valid URL starting with http:// or https://',
            path: ['github_url'],
        }
    )
    .refine(
        (data) => {
            if (data.submission_type === 'notes') {
                return data.notes && data.notes.trim() !== '';
            }
            return true;
        },
        {
            message: 'Please enter submission notes',
            path: ['notes'],
        }
    )
    .refine(
        (data) => {
            if (data.submission_type === 'file_upload') {
                return data.file_id && data.file_id.trim() !== '';
            }
            return true;
        },
        {
            message: 'Please upload a file',
            path: ['file_id'],
        }
    );

type FormData = z.infer<typeof formSchema>;

interface SubmissionFormModalProps {
    assessmentId: string;
    applicationId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: (submission: AssessmentSubmission) => void;
}

export const SubmissionFormModal = ({
    assessmentId,
    applicationId,
    open,
    onOpenChange,
    onSuccess,
}: SubmissionFormModalProps) => {
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors, isSubmitting, isValid },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: {
            submission_type: 'github',
            github_url: '',
            file_id: '',
            notes: '',
        },
    });

    const submissionType = watch('submission_type');

    const onSubmit = async (data: FormData) => {
        try {
            const submission = await createSubmission(assessmentId, {
                submission_type: data.submission_type,
                github_url:
                    data.submission_type === 'github'
                        ? data.github_url
                        : undefined,
                file_id:
                    data.submission_type === 'file_upload'
                        ? data.file_id
                        : undefined,
                notes:
                    data.submission_type === 'notes' ? data.notes : undefined,
            });

            toast.success('Submission added');
            reset();
            setUploadedFileName(null);
            onOpenChange(false);
            onSuccess?.(submission);
        } catch {
            toast.error('Failed to add submission');
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            reset();
            setUploadedFileName(null);
        }
        onOpenChange(newOpen);
    };

    const handleFileUploadComplete = (fileId: string, fileName: string) => {
        setValue('file_id', fileId, { shouldValidate: true });
        setUploadedFileName(fileName);
    };

    const handleFileRemoved = () => {
        setValue('file_id', '', { shouldValidate: true });
        setUploadedFileName(null);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Submission</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                  <DialogBody className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="submission-type" className="text-xs font-medium text-muted-foreground">
                            Submission Type
                        </Label>
                        <Controller
                            name="submission_type"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        if (value !== 'file_upload') {
                                            handleFileRemoved();
                                        }
                                    }}
                                    value={field.value}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger
                                        id="submission-type"
                                        aria-invalid={!!errors.submission_type}
                                        aria-describedby={errors.submission_type ? 'submission-type-error' : undefined}
                                    >
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUBMISSION_TYPE_OPTIONS.map((type) => (
                                            <SelectItem
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.submission_type && (
                            <p id="submission-type-error" className="text-sm text-destructive" role="alert">
                                {errors.submission_type.message}
                            </p>
                        )}
                    </div>

                    {submissionType === 'github' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="submission-github-url" className="text-xs font-medium text-muted-foreground">
                                GitHub URL
                            </Label>
                            <Controller
                                name="github_url"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="submission-github-url"
                                        type="url"
                                        placeholder="https://github.com/username/repo"
                                        disabled={isSubmitting}
                                        aria-required="true"
                                        aria-invalid={!!errors.github_url}
                                        aria-describedby={errors.github_url ? 'submission-github-url-error' : undefined}
                                    />
                                )}
                            />
                            {errors.github_url && (
                                <p id="submission-github-url-error" className="text-sm text-destructive" role="alert">
                                    {errors.github_url.message}
                                </p>
                            )}
                        </div>
                    )}

                    {submissionType === 'file_upload' && (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">
                                File
                            </Label>
                            <AssessmentFileUpload
                                applicationId={applicationId}
                                onUploadComplete={handleFileUploadComplete}
                                onFileRemoved={handleFileRemoved}
                                uploadedFileName={uploadedFileName}
                                disabled={isSubmitting}
                            />
                            {errors.file_id && (
                                <p className="text-sm text-destructive" role="alert">
                                    {errors.file_id.message}
                                </p>
                            )}
                        </div>
                    )}

                    {submissionType === 'notes' && (
                        <div className="space-y-1.5">
                            <Label htmlFor="submission-notes" className="text-xs font-medium text-muted-foreground">
                                Notes
                            </Label>
                            <Controller
                                name="notes"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        id="submission-notes"
                                        placeholder="Describe your submission..."
                                        rows={4}
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    />
                                )}
                            />
                        </div>
                    )}
                  </DialogBody>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isValid}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Submission'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
