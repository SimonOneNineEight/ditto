import { z } from 'zod';

export const interviewerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
    role: z.string().max(255, 'Role must be 255 characters or less').optional(),
});

export const interviewerFormSchema = z.object({
    interviewers: z.array(interviewerSchema).min(1),
});

export type InterviewerFormData = z.infer<typeof interviewerFormSchema>;
