export const JOB_TYPES = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
] as const;

export type JobTypeValue = (typeof JOB_TYPES)[number]['value'];

export const JOB_TYPE_LABELS: Record<string, string> = Object.fromEntries(
    JOB_TYPES.map((t) => [t.value, t.label])
);

export function formatJobType(jobType: string | undefined): string {
    if (!jobType) return '—';
    return JOB_TYPE_LABELS[jobType] || jobType;
}
