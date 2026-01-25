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
import { FileUpload } from '@/components/file-upload';
import {
    getPresignedUploadUrl,
    uploadToS3,
    confirmUpload,
} from '@/lib/file-service';

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

interface ApplicationFormProps {
    mode?: 'create' | 'edit';
    applicationId?: string;
    initialData?: {
        company?: { id?: string; name: string };
        position?: string;
        location?: string;
        jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
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
            description: initialData?.description || '',
            sourceUrl: initialData?.sourceUrl || '',
            platform: initialData?.platform || '',
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

            <FileUpload
                onFileSelect={setPendingFile}
                label="Attach Resume or Cover Letter (Optional)"
            />

            <div className="flex justify-between items-center mt-12 pt-6">
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
                          : 'Save'}
                </Button>
            </div>
        </form>
    );
};

export default ApplicationForm;
