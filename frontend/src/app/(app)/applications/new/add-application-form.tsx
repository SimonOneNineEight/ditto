'use client';

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

const AddApplicationForm = () => {
    const router = useRouter();

    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { isSubmitting },
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

    const handleImport = (data: {
        company: string;
        position: string;
        description?: string;
        location?: string;
        sourceUrl?: string;
        platform?: string;
    }) => {
        const options = { shouldDirty: true, shouldTouch: true };
        setValue('company', { name: data.company }, options);
        setValue('position', data.position, options);
        if (data.description)
            setValue('description', data.description, options);
        if (data.location) setValue('location', data.location, options);
        if (data.sourceUrl) setValue('sourceUrl', data.sourceUrl, options);
        if (data.platform) setValue('platform', data.platform, options);
        toast.success('Details imported');
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
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <UrlImport onImport={handleImport} />

            <div className="space-y-1">
                <Controller
                    name="company"
                    control={control}
                    render={({ field }) => (
                        <CompanyAutocomplete
                            value={field.value}
                            onChange={field.onChange}
                        />
                    )}
                />

                <FormField
                    label="Position"
                    required
                    placeholder="Job title"
                    {...register('position')}
                />
            </div>

            <div className="space-y-1">
                <FormField
                    label="Location"
                    placeholder="e.g. San Francisco, CA or Remote"
                    {...register('location')}
                />

                <FormFieldWrapper>
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

            <div className="space-y-1">
                <FormField
                    label="Description"
                    multiline
                    placeholder="What does this role involve?"
                    {...register('description')}
                />
                <FormField
                    label="Notes"
                    multiline
                    placeholder="Your notes about this application"
                    {...register('notes')}
                />
            </div>

            <div className="space-y-1">
                <FormField
                    label="Source URL"
                    placeholder="https://..."
                    {...register('sourceUrl')}
                />
                <FormField
                    label="Platform"
                    placeholder="e.g. LinkedIn, Indeed, Company Website"
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
