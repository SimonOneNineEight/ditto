'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { type ApplicationWithDetails } from '@/services/application-service';

function getStatusVariant(status: string): 'default' | 'applied' | 'interviewing' | 'offered' | 'rejected' {
    const lower = status.toLowerCase();
    if (lower === 'applied') return 'applied';
    if (lower === 'interview') return 'interviewing';
    if (lower === 'offer') return 'offered';
    if (lower === 'rejected') return 'rejected';
    return 'default';
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface MobileAppCardProps {
    application: ApplicationWithDetails;
}

export function MobileAppCard({ application }: MobileAppCardProps) {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/applications/${application.id}`);
    };

    const company = application.company?.name || 'Unknown Company';
    const position = application.job?.title || 'Unknown Position';
    const location = application.job?.location;
    const appliedDate = formatDate(application.applied_at);
    const status = application.status?.name || 'Unknown';

    return (
        <button
            onClick={handleClick}
            className="w-full text-left bg-card border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm text-foreground truncate">
                    {company}
                </span>
                <Badge variant={getStatusVariant(status)} className="shrink-0">
                    {status}
                </Badge>
            </div>
            <p className="text-[13px] text-muted-foreground mt-1 truncate">
                {position}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
                {[location, appliedDate].filter(Boolean).join(' · ')}
            </p>
        </button>
    );
}
