import { z } from 'zod';

export const assessmentSchema = z.object({
    assessment_type: z.enum(
        [
            'take_home_project',
            'live_coding',
            'system_design',
            'data_structures',
            'case_study',
            'other',
        ],
        {
            required_error: 'Please select an assessment type',
        }
    ),
    title: z
        .string()
        .min(1, 'Title is required')
        .max(255, 'Title must be 255 characters or less'),
    due_date: z.date({ required_error: 'Due date is required' }),
    instructions: z.string().max(10000, 'Instructions must be 10,000 characters or less').optional(),
    requirements: z.string().max(10000, 'Requirements must be 10,000 characters or less').optional(),
});

export type AssessmentFormData = z.infer<typeof assessmentSchema>;
