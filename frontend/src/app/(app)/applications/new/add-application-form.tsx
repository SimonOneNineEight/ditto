'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { FileUpload } from '@/components/file-upload';
import {
    getPresignedUploadUrl,
    uploadToS3,
    confirmUpload,
} from '@/lib/file-service';
import { JOB_TYPES } from '@/lib/constants';

const PLATFORMS = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'indeed', label: 'Indeed' },
    { value: 'glassdoor', label: 'Glassdoor' },
    { value: 'company-website', label: 'Company Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'other', label: 'Other' },
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
    minSalary: z.string().optional(),
    maxSalary: z.string().optional(),
    description: z.string().optional(),
    sourceUrl: z.string().url().optional().or(z.literal('')),
    platform: z.string().optional(),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const STAGGER_DELAY = 150; // ms between each field

interface ApplicationFormProps {
    mode?: 'create' | 'edit';
    applicationId?: string;
    initialData?: {
        company?: { id?: string; name: string };
        position?: string;
        location?: string;
        jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
        minSalary?: string;
        maxSalary?: string;
        description?: string;
        sourceUrl?: string;
        platform?: string;
        notes?: string;
    };
}

const ApplicationForm = ({
    mode = 'create',
    applicationId,
    initialData,
}: ApplicationFormProps) => {
    const router = useRouter();
    const [highlightedFields, setHighlightedFields] = useState<Set<string>>(
        new Set()
    );
    const [pendingFile, setPendingFile] = useState<File | null>(null);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        formState: { isSubmitting, errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            company: initialData?.company || { name: '' },
            position: initialData?.position || '',
            location: initialData?.location || '',
            jobType: initialData?.jobType || undefined,
            minSalary: initialData?.minSalary || '',
            maxSalary: initialData?.maxSalary || '',
            description: initialData?.description || '',
            sourceUrl: initialData?.sourceUrl || '',
            platform: initialData?.platform || undefined,
            notes: initialData?.notes || '',
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
            let resultApplicationId = applicationId;

            if (mode === 'edit' && applicationId) {
                await api.put(`/api/applications/${applicationId}`, {
                    company_name: data.company.name,
                    title: data.position,
                    location: data.location || undefined,
                    job_type: data.jobType || undefined,
                    description: data.description || undefined,
                    source_url: data.sourceUrl || undefined,
                    platform: data.platform || undefined,
                    notes: data.notes || undefined,
                    min_salary: data.minSalary ? parseFloat(data.minSalary) : undefined,
                    max_salary: data.maxSalary ? parseFloat(data.maxSalary) : undefined,
                });
            } else {
                const response = await api.post(
                    '/api/applications/quick-create',
                    {
                        company_name: data.company.name,
                        title: data.position,
                        location: data.location || undefined,
                        job_type: data.jobType || undefined,
                        description: data.description || undefined,
                        source_url: data.sourceUrl || undefined,
                        platform: data.platform || undefined,
                        notes: data.notes || undefined,
                        min_salary: data.minSalary ? parseFloat(data.minSalary) : undefined,
                        max_salary: data.maxSalary ? parseFloat(data.maxSalary) : undefined,
                    }
                );
                resultApplicationId = response.data?.data?.id;
            }

            // Upload pending file if exists
            if (pendingFile && resultApplicationId) {
                try {
                    const presigned = await getPresignedUploadUrl(
                        pendingFile.name,
                        pendingFile.type,
                        pendingFile.size,
                        resultApplicationId
                    );
                    await uploadToS3(presigned.presigned_url, pendingFile);
                    await confirmUpload(
                        presigned.s3_key,
                        pendingFile.name,
                        pendingFile.type,
                        pendingFile.size,
                        resultApplicationId
                    );
                    toast.success(
                        mode === 'edit'
                            ? 'Application updated with document'
                            : 'Application saved with document'
                    );
                } catch {
                    toast.success(
                        mode === 'edit'
                            ? 'Application updated, but file upload failed'
                            : 'Application saved, but file upload failed'
                    );
                }
            } else {
                toast.success(
                    mode === 'edit' ? 'Application updated' : 'Application saved'
                );
            }

            router.push('/applications');
        } catch {
            toast.error(
                mode === 'edit'
                    ? 'Failed to update application'
                    : 'Failed to save application'
            );
        }
    };

    const handleCancel = () => {
        router.push('/applications');
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
            <UrlImport onImport={handleImport} />

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

            <div className="flex gap-4">
                <FormFieldWrapper className="flex-1">
                    <FormLabel>Min Salary</FormLabel>
                    <Input
                        placeholder="$0"
                        type="number"
                        className="border-0 px-0 h-auto py-1 shadow-none focus-visible:ring-0"
                        {...register('minSalary')}
                    />
                </FormFieldWrapper>
                <FormFieldWrapper className="flex-1">
                    <FormLabel>Max Salary</FormLabel>
                    <Input
                        placeholder="$0"
                        type="number"
                        className="border-0 px-0 h-auto py-1 shadow-none focus-visible:ring-0"
                        {...register('maxSalary')}
                    />
                </FormFieldWrapper>
            </div>

            <FormField
                label="Description"
                multiline
                rows={5}
                className="min-h-[120px]"
                placeholder="Paste or enter the job description..."
                highlight={highlightedFields.has('description')}
                {...register('description')}
            />

            <FormField
                label="Notes"
                multiline
                rows={4}
                className="min-h-[100px]"
                placeholder="Add any personal notes about this application..."
                {...register('notes')}
            />

            <FormField
                label="Source URL"
                placeholder="https://"
                highlight={highlightedFields.has('sourceUrl')}
                {...register('sourceUrl')}
            />

            <FormFieldWrapper className={highlightedFields.has('platform') ? 'field-highlight' : ''}>
                <FormLabel className="mb-1">Platform</FormLabel>
                <Controller
                    name="platform"
                    control={control}
                    render={({ field }) => (
                        <Select
                            onValueChange={field.onChange}
                            value={field.value}
                        >
                            <SelectTrigger className="border-0 px-0 h-auto py-1 shadow-none focus:ring-0">
                                <SelectValue placeholder="Select platform (e.g., LinkedIn, Indeed)" />
                            </SelectTrigger>
                            <SelectContent>
                                {PLATFORMS.map((p) => (
                                    <SelectItem
                                        key={p.value}
                                        value={p.value}
                                    >
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
            </FormFieldWrapper>

            <FormFieldWrapper>
                <FormLabel>Attachments</FormLabel>
                <FileUpload onFileSelect={setPendingFile} />
            </FormFieldWrapper>

            <div className="flex justify-end items-center gap-3 mt-12 pt-6">
                <Button type="button" variant="ghost" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? mode === 'edit'
                            ? 'Updating...'
                            : 'Saving...'
                        : mode === 'edit'
                          ? 'Update'
                          : 'Save Application'}
                </Button>
            </div>
        </form>
    );
};

export default ApplicationForm;
