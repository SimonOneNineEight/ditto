import { z } from 'zod';

export const submissionSchema = z
    .object({
        submission_type: z.enum(['github', 'file_upload', 'notes'], {
            required_error: 'Please select a submission type',
        }),
        github_url: z.string().optional(),
        file_id: z.string().optional(),
        notes: z.string().max(10000, 'Notes must be 10,000 characters or less').optional(),
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

export type SubmissionFormData = z.infer<typeof submissionSchema>;
