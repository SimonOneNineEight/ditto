'use client';

import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UrlImportProps {
    onImport: (data: {
        company: string;
        position: string;
        description?: string;
        location?: string;
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

    const isValidUrl = url.startsWith('http');

    const handleImport = async () => {
        if (!isValidUrl) return;

        setStatus('loading');

        try {
            const response = await api.post<ExtractResponse>('/api/extract-job-url', { url });
            const extracted = response.data.data;

            onImport({
                company: extracted.company,
                position: extracted.title,
                description: extracted.description || undefined,
                location: extracted.location || undefined,
                sourceUrl: url,
                platform: platformDisplayNames[extracted.platform] || extracted.platform,
            });

            setStatus('success');

            // Show warnings if any
            if (response.data.warnings && response.data.warnings.length > 0) {
                toast.warning(response.data.warnings.join(', '));
            }
        } catch (error: unknown) {
            setStatus('error');
            const message = error instanceof Error ? error.message : 'Failed to extract job details';
            toast.error(message);
        }
    };

    const getButtonContent = () => {
        switch (status) {
            case 'loading':
                return <Loader2 className="h-4 w-4 animate-spin" />;
            case 'success':
                return 'Imported';
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
            <Input
                type="url"
                value={url}
                onChange={(e) => {
                    setUrl(e.target.value);
                    if (status !== 'idle') setStatus('idle');
                }}
                placeholder="Paste job URL to import details..."
                className="flex-1"
            />
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
