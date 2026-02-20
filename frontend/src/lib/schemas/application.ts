import { z } from 'zod';

export const companySchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Company name is required').max(255, 'Company name must be 255 characters or less'),
    domain: z.string().optional(),
    logoUrl: z.string().optional(),
    website: z.string().optional(),
});

export const applicationSchema = z.object({
    company: companySchema,
    position: z.string().min(1, 'Position is required').max(255, 'Position must be 255 characters or less'),
    location: z.string().optional(),
    jobType: z
        .enum(['full-time', 'part-time', 'contract', 'internship'])
        .optional(),
    minSalary: z.string().optional(),
    maxSalary: z.string().optional(),
    description: z.string().max(10000, 'Description must be 10,000 characters or less').optional(),
    sourceUrl: z.string().url('Invalid URL format').max(2048, 'URL must be 2048 characters or less').optional().or(z.literal('')),
    platform: z.string().max(50, 'Platform must be 50 characters or less').optional(),
    notes: z.string().max(10000, 'Notes must be 10,000 characters or less').optional(),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;

export const urlImportSchema = z.object({
    url: z.string().url('Please enter a valid URL'),
});
