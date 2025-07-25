import React from 'react';
import { Card } from '@/components/ui/card';

type Props = {
    children: React.ReactElement;
};

const MarketBanner = ({ children }: Props) => {
    return (
        <Card className="flex flex-col justify-center items-center gap-8 w-1/2 h-full m-4 bg-primary/50">
            {children}
        </Card>
    );
};

export default MarketBanner;
