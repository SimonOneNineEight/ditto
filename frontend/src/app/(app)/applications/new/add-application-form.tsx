'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import UrlImport from './url-import';
import FormField from './form-field';
import CompanyAutocomplete from './company-autocomplete';
import { FormLabel, FormFieldWrapper } from './form-label';

const JOB_TYPES = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
] as const;

const companySchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Company is required'),
    domain: z.string().optional(),
    logoUrl: z.string().optional(),
    website: z.string().optional(),
});

const formSchema = z.object({
    company: companySchema,
    position: z.string().min(1, 'Position is required'),
    location: z.string().optional(),
    jobType: z
        .enum(['full-time', 'part-time', 'contract', 'internship'])
        .optional(),
    description: z.string().optional(),
    sourceUrl: z.string().url().optional().or(z.literal('')),
    platform: z.string().optional(),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const STAGGER_DELAY = 150; // ms between each field

const AddApplicationForm = () => {
    const router = useRouter();
    const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());

    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { isSubmitting, errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            company: { name: '' },
            position: '',
            location: '',
            jobType: undefined,
            description: '',
            sourceUrl: '',
            platform: '',
            notes: '',
        },
    });

    const triggerHighlight = useCallback((fieldName: string) => {
        setHighlightedFields((prev) => new Set(prev).add(fieldName));
        setTimeout(() => {
            setHighlightedFields((prev) => {
                const next = new Set(prev);
                next.delete(fieldName);
                return next;
            });
        }, 1500); // Match animation duration
    }, []);

    const handleImport = (data: {
        company: string;
        position: string;
        description?: string;
        location?: string;
        jobType?: string;
        sourceUrl?: string;
        platform?: string;
    }) => {
        const options = { shouldDirty: true, shouldTouch: true };

        // Build list of fields to populate with stagger
        const fields: { name: keyof FormData; value: unknown }[] = [
            { name: 'company', value: { name: data.company } },
            { name: 'position', value: data.position },
        ];

        if (data.location) fields.push({ name: 'location', value: data.location });
        if (data.jobType) fields.push({ name: 'jobType', value: data.jobType });
        if (data.description) fields.push({ name: 'description', value: data.description });
        if (data.sourceUrl) fields.push({ name: 'sourceUrl', value: data.sourceUrl });
        if (data.platform) fields.push({ name: 'platform', value: data.platform });

        // Stagger field population
        fields.forEach((field, index) => {
            setTimeout(() => {
                setValue(field.name, field.value as never, options);
                triggerHighlight(field.name);
            }, index * STAGGER_DELAY);
        });

        // Show toast after all fields populated
        setTimeout(() => {
            toast.success('Details imported');
        }, fields.length * STAGGER_DELAY);
    };

    const onSubmit = async (data: FormData) => {
        try {
            await api.post('/api/applications/quick-create', {
                company_name: data.company.name,
                title: data.position,
                location: data.location || undefined,
                job_type: data.jobType || undefined,
                description: data.description || undefined,
                source_url: data.sourceUrl || undefined,
                platform: data.platform || undefined,
                notes: data.notes || undefined,
            });

            toast.success('Application saved');
            router.push('/applications');
        } catch {
            toast.error('Failed to save application');
        }
    };

    const handleCancel = () => {
        router.push('/applications');
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
            <UrlImport onImport={handleImport} />

            <div className="space-y-3">
                <Controller
                    name="company"
                    control={control}
                    render={({ field }) => (
                        <CompanyAutocomplete
                            value={field.value}
                            onChange={field.onChange}
                            highlight={highlightedFields.has('company')}
                            error={errors.company?.name?.message}
                        />
                    )}
                />

                <FormField
                    label="Position"
                    required
                    placeholder="Job title"
                    highlight={highlightedFields.has('position')}
                    error={errors.position?.message}
                    {...register('position')}
                />
            </div>

            <div className="space-y-3">
                <FormField
                    label="Location"
                    placeholder="e.g. San Francisco, CA or Remote"
                    highlight={highlightedFields.has('location')}
                    {...register('location')}
                />

                <FormFieldWrapper className={highlightedFields.has('jobType') ? 'field-highlight' : ''}>
                    <FormLabel className="mb-1">Job Type</FormLabel>
                    <Controller
                        name="jobType"
                        control={control}
                        render={({ field }) => (
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <SelectTrigger className="border-0 px-0 h-auto py-1 shadow-none focus:ring-0">
                                    <SelectValue placeholder="Select job type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {JOB_TYPES.map((type) => (
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
                </FormFieldWrapper>
            </div>

            <div className="space-y-3">
                <FormField
                    label="Description"
                    multiline
                    rows={6}
                    placeholder="What does this role involve?"
                    highlight={highlightedFields.has('description')}
                    {...register('description')}
                />
                <FormField
                    label="Notes"
                    multiline
                    placeholder="Your notes about this application"
                    {...register('notes')}
                />
            </div>

            <div className="space-y-3">
                <FormField
                    label="Source URL"
                    placeholder="https://..."
                    highlight={highlightedFields.has('sourceUrl')}
                    {...register('sourceUrl')}
                />
                <FormField
                    label="Platform"
                    placeholder="e.g. LinkedIn, Indeed, Company Website"
                    highlight={highlightedFields.has('platform')}
                    {...register('platform')}
                />
            </div>

            <div className="flex justify-between items-center mt-12 pt-6">
                <Button type="button" variant="ghost" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    );
};

export default AddApplicationForm;
