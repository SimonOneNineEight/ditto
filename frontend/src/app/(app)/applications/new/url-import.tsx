'use client';

import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { urlImportSchema } from '@/lib/schemas/application';

interface UrlImportProps {
    onImport: (data: {
        company: string;
        position: string;
        description?: string;
        location?: string;
        jobType?: string;
        sourceUrl?: string;
        platform?: string;
    }) => void;
}

interface ExtractResponse {
    data: {
        title: string;
        company: string;
        location: string;
        description: string;
        job_type?: string;
        platform: string;
    };
    warnings?: string[];
}

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

// Map backend platform names to display names
const platformDisplayNames: Record<string, string> = {
    linkedin: 'LinkedIn',
    indeed: 'Indeed',
    glassdoor: 'Glassdoor',
    angellist: 'AngelList',
    generic: 'Website',
};

const UrlImport = ({ onImport }: UrlImportProps) => {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<ImportStatus>('idle');
    const [urlError, setUrlError] = useState<string | null>(null);

    const isValidUrl = urlImportSchema.safeParse({ url }).success;

    const handleImport = async () => {
        const result = urlImportSchema.safeParse({ url });
        if (!result.success) {
            setUrlError(result.error.errors[0]?.message || 'Invalid URL');
            return;
        }
        setUrlError(null);

        setStatus('loading');

        try {
            const response = await api.post<ExtractResponse>('/api/extract-job-url', { url });
            const extracted = response.data.data;

            onImport({
                company: extracted.company,
                position: extracted.title,
                description: extracted.description || undefined,
                location: extracted.location || undefined,
                jobType: extracted.job_type || undefined,
                sourceUrl: url,
                platform: platformDisplayNames[extracted.platform] || extracted.platform,
            });

            setStatus('success');

            // Show warnings if any
            if (response.data.warnings && response.data.warnings.length > 0) {
                toast.warning(response.data.warnings.join(', '));
            }
        } catch {
            setStatus('error');
        }
    };

    const getButtonContent = () => {
        switch (status) {
            case 'loading':
                return <Loader2 className="h-4 w-4 animate-spin text-secondary" />;
            case 'success':
                return <span className="text-accent">Imported</span>;
            default:
                return 'Import';
        }
    };

    const getContainerClasses = () => {
        const base =
            'group flex items-center gap-3 py-3 border-b border-transparent transition-colors';
        if (status === 'loading') return `${base} border-secondary/30`;
        if (status === 'success') return `${base} border-accent/30`;
        return `${base} hover:border-border focus-within:border-border`;
    };

    return (
        <div className={getContainerClasses()}>
            <Link2 className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
            <div className="flex-1">
                <Input
                    type="url"
                    value={url}
                    onChange={(e) => {
                        setUrl(e.target.value);
                        if (urlError) setUrlError(null);
                        if (status !== 'idle') setStatus('idle');
                    }}
                    placeholder="Paste LinkedIn or Indeed URL to import..."
                    aria-invalid={!!urlError}
                    aria-describedby={urlError ? 'url-import-error' : undefined}
                />
                {urlError && (
                    <p id="url-import-error" role="alert" className="text-xs text-destructive mt-1">
                        {urlError}
                    </p>
                )}
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                disabled={!isValidUrl || status === 'loading'}
                className={`
                    text-xs font-medium transition-all
                    ${status === 'idle' ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' : 'opacity-100'}
                    ${status === 'success' ? 'text-accent border-accent/30' : ''}
                    ${status === 'loading' ? 'text-secondary border-secondary/30' : ''}
                `}
            >
                {getButtonContent()}
            </Button>
        </div>
    );
};

export default UrlImport;
