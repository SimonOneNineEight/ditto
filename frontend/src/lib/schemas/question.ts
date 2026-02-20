import { z } from 'zod';

export const questionSchema = z.object({
    question_text: z.string().min(1, 'Question is required').max(5000, 'Question must be 5,000 characters or less'),
    answer_text: z.string().max(5000, 'Answer must be 5,000 characters or less').optional(),
});

export const questionFormSchema = z.object({
    questions: z.array(questionSchema).min(1),
});

export type QuestionFormData = z.infer<typeof questionFormSchema>;
