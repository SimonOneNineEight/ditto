'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Download, Settings, User, Plus } from 'lucide-react';

export function ButtonDemo() {
    const [loading, setLoading] = useState(false);

    const handleLoadingDemo = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Button Component Demo</h1>

            {/* Variants */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Variants</h2>
                <div className="flex flex-wrap gap-4">
                    <Button variant="default">Default</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                    <Button variant="warning">Warning</Button>
                    <Button variant="info">Info</Button>
                </div>
            </section>

            {/* Sizes */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Sizes</h2>
                <div className="flex items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon" icon={<Settings size={16} />} iconPosition="only" hasIcon />
                </div>
            </section>

            {/* Full Width */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Full Width</h2>
                <Button size="full">Full Width Button</Button>
            </section>

            {/* Icons */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">With Icons</h2>
                <div className="space-y-2">
                    <div className="flex gap-4">
                        <Button icon={<Heart size={16} />} iconPosition="left" hasIcon>
                            Like
                        </Button>
                        <Button icon={<Download size={16} />} iconPosition="right" hasIcon>
                            Download
                        </Button>
                    </div>
                    <div className="flex gap-4">
                        <Button icon={<Plus size={16} />} iconPosition="only" hasIcon size="icon" />
                        <Button icon={<User size={16} />} iconPosition="only" hasIcon size="icon" variant="outline" />
                        <Button icon={<Settings size={16} />} iconPosition="only" hasIcon size="icon" variant="ghost" />
                    </div>
                </div>
            </section>

            {/* Loading States */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Loading States</h2>
                <div className="flex gap-4">
                    <Button isLoading={loading} onClick={handleLoadingDemo}>
                        {loading ? 'Loading...' : 'Click to Load'}
                    </Button>
                    <Button isLoading loadingText="Saving..." variant="outline">
                        Save
                    </Button>
                    <Button isLoading loadingText="Processing" variant="destructive">
                        Delete
                    </Button>
                </div>
            </section>

            {/* Disabled States */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Disabled States</h2>
                <div className="flex gap-4">
                    <Button disabled>Disabled</Button>
                    <Button disabled variant="outline">
                        Disabled Outline
                    </Button>
                    <Button disabled icon={<Heart size={16} />} iconPosition="left" hasIcon>
                        Disabled with Icon
                    </Button>
                </div>
            </section>

            {/* Complex Examples */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold">Complex Examples</h2>
                <div className="space-y-2">
                    <div className="flex gap-4">
                        <Button 
                            variant="info" 
                            size="lg" 
                            icon={<Download size={16} />} 
                            iconPosition="left" 
                            hasIcon
                        >
                            Download Report
                        </Button>
                        <Button 
                            variant="warning" 
                            icon={<Settings size={16} />} 
                            iconPosition="right" 
                            hasIcon
                        >
                            Configure Settings
                        </Button>
                    </div>
                    <Button 
                        size="full" 
                        variant="destructive" 
                        icon={<User size={16} />} 
                        iconPosition="left" 
                        hasIcon
                    >
                        Delete User Account
                    </Button>
                </div>
            </section>
        </div>
    );
}