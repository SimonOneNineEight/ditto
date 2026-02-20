import { z } from 'zod';

export const interviewFormSchema = z.object({
    interview_type: z.enum(
        ['phone_screen', 'technical', 'behavioral', 'panel', 'onsite', 'other'],
        {
            required_error: 'Please select an interview type',
        }
    ),
    scheduled_date: z.date({ required_error: 'Date is required' }),
    scheduled_time: z.string().optional(),
    duration_minutes: z.string().optional(),
});

export type InterviewFormData = z.infer<typeof interviewFormSchema>;

export const addRoundSchema = z.object({
    interview_type: z.enum(
        ['phone_screen', 'technical', 'behavioral', 'panel', 'onsite', 'other'],
        {
            required_error: 'Please select an interview type',
        }
    ),
    scheduled_date: z.date({ required_error: 'Date is required' }),
    scheduled_time: z.string().optional(),
    duration_minutes: z.string().optional(),
});

export type AddRoundFormData = z.infer<typeof addRoundSchema>;
