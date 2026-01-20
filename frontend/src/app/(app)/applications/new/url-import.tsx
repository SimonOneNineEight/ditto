'use client';

import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
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

type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

const UrlImport = ({ onImport }: UrlImportProps) => {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<ImportStatus>('idle');

    const isValidUrl = url.startsWith('http');

    const handleImport = async () => {
        if (!isValidUrl) return;

        setStatus('loading');

        try {
            // TODO: Replace with actual API call to /api/jobs/extract-url
            await new Promise((resolve) => setTimeout(resolve, 1200));

            // Detect platform from URL
            const detectPlatform = (url: string): string | undefined => {
                if (url.includes('linkedin.com')) return 'LinkedIn';
                if (url.includes('indeed.com')) return 'Indeed';
                if (url.includes('glassdoor.com')) return 'Glassdoor';
                if (url.includes('greenhouse.io')) return 'Greenhouse';
                if (url.includes('lever.co')) return 'Lever';
                return undefined;
            };

            // Mock data for now
            const data = {
                company: 'Stripe',
                position: 'Senior Software Engineer, Platform',
                description:
                    "Join our Platform team to build the infrastructure that powers millions of businesses worldwide.\n\nYou'll work on distributed systems, API design, and help scale our core payment processing platform.",
                location: 'San Francisco, CA',
                sourceUrl: url,
                platform: detectPlatform(url),
            };

            onImport(data);
            setStatus('success');
        } catch {
            setStatus('error');
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
