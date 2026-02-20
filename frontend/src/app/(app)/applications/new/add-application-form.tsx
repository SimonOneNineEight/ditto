'use client';

import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { applicationSchema, type ApplicationFormData } from '@/lib/schemas/application';
import { isValidationError, getFieldErrors } from '@/lib/errors';
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
import dynamic from 'next/dynamic';
import UrlImport from './url-import';
import FormField from './form-field';
import CompanyAutocomplete from './company-autocomplete';
import { FormLabel, FormFieldWrapper } from './form-label';
import { Skeleton } from '@/components/ui/skeleton';

const RichTextEditor = dynamic(
    () => import('@/components/rich-text-editor').then((mod) => ({ default: mod.RichTextEditor })),
    { loading: () => <Skeleton className="h-[150px] w-full rounded-lg" />, ssr: false }
);
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

type FormData = ApplicationFormData;

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
        setError,
        formState: { isSubmitting, isValid, errors },
    } = useForm<FormData>({
        resolver: zodResolver(applicationSchema),
        mode: 'onChange',
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

            router.push(mode === 'edit' ? `/applications/${applicationId}` : '/applications');
        } catch (error) {
            if (isValidationError(error)) {
                const fieldErrors = getFieldErrors(error);
                if (fieldErrors) {
                    Object.entries(fieldErrors).forEach(([field, message]) => {
                        setError(field as keyof FormData, { message });
                    });
                }
            }
        }
    };

    const handleCancel = () => {
        router.push(mode === 'edit' ? `/applications/${applicationId}` : '/applications');
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
                        inputMode="decimal"
                        className="border-0 px-0 h-auto py-1 shadow-none focus-visible:ring-0"
                        {...register('minSalary')}
                    />
                </FormFieldWrapper>
                <FormFieldWrapper className="flex-1">
                    <FormLabel>Max Salary</FormLabel>
                    <Input
                        placeholder="$0"
                        type="number"
                        inputMode="decimal"
                        className="border-0 px-0 h-auto py-1 shadow-none focus-visible:ring-0"
                        {...register('maxSalary')}
                    />
                </FormFieldWrapper>
            </div>

            <FormFieldWrapper>
                <FormLabel>Description</FormLabel>
                <div className="mt-2">
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <RichTextEditor
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="Paste or enter the job description..."
                            />
                        )}
                    />
                </div>
            </FormFieldWrapper>

            <FormFieldWrapper>
                <FormLabel>Notes</FormLabel>
                <div className="mt-2">
                    <Controller
                        name="notes"
                        control={control}
                        render={({ field }) => (
                            <RichTextEditor
                                value={field.value || ''}
                                onChange={field.onChange}
                                placeholder="Add any personal notes about this application..."
                            />
                        )}
                    />
                </div>
            </FormFieldWrapper>

            <FormField
                label="Source URL"
                placeholder="https://"
                inputMode="url"
                autoComplete="url"
                highlight={highlightedFields.has('sourceUrl')}
                error={errors.sourceUrl?.message}
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
                <FormLabel className="mb-2">Attachments</FormLabel>
                <FileUpload onFileSelect={setPendingFile} />
            </FormFieldWrapper>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end items-stretch sm:items-center gap-3 mt-12 pt-6">
                <Button type="button" variant="ghost" onClick={handleCancel} className="w-full sm:w-auto">
                    Cancel
                </Button>
                <Button type="submit" disabled={!isValid || isSubmitting} aria-disabled={!isValid || isSubmitting} className="w-full sm:w-auto">
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
