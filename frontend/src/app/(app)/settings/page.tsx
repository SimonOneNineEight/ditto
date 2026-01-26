'use client';

import { PageHeader } from '@/components/page-header';

export default function SettingsPage() {
    return (
        <>
            <PageHeader
                title="Settings"
                subtitle="Manage your account and preferences"
            />

            <section className="max-w-2xl">
                <p className="text-muted-foreground">
                    Account settings coming soon.
                </p>
            </section>
        </>
    );
}
