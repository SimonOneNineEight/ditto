import React from 'react';
import { Briefcase, CircleCheck } from 'lucide-react';

type Props = {
    variant: 'login' | 'register';
};

const loginFeatures = [
    'Organize all your applications in one place',
    'Track interview schedules and prep notes',
    'Store important documents and files',
];

const registerFeatures = [
    'Free to use, no credit card required',
    'Sync across all your devices',
    'Secure and private by design',
];

const MarketBanner = ({ variant }: Props) => {
    const features = variant === 'login' ? loginFeatures : registerFeatures;

    return (
        <div
            className="hidden lg:flex w-[600px] shrink-0 h-full flex-col items-center justify-center p-[60px] gap-8 text-white"
            style={{
                background: `
                    radial-gradient(ellipse at 30% 20%, #2563eb60 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 80%, #1e3a5f 0%, transparent 50%),
                    radial-gradient(ellipse at 50% 50%, #1a3355 0%, transparent 60%),
                    linear-gradient(to bottom, #0a0f1a, #0f172a)
                `,
            }}
        >
            <div className="flex items-center gap-3">
                <Briefcase className="h-12 w-12 text-blue-500" />
                <span className="text-[44px] font-bold">Ditto</span>
            </div>

            <p className="text-[24px] font-medium text-center max-w-[400px] text-white/90">
                Your job search command center
            </p>

            <div className="flex flex-col gap-4">
                {features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                        <CircleCheck className="h-6 w-6 text-blue-500 shrink-0" />
                        <span className="text-[16px] text-white/80">
                            {feature}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MarketBanner;
