'use client';

import { PageHeader } from '@/components/page-header';
import { NotificationPreferences } from '@/components/notification-center';

export default function SettingsPage() {
    return (
        <>
            <PageHeader
                title="Settings"
                subtitle="Manage your account and preferences"
            />

            <section className="flex w-full flex-col gap-6">
                <NotificationPreferences />
            </section>
        </>
    );
}
