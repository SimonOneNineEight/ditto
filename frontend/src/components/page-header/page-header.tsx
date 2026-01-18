'use client';

import React from 'react';
import Link from 'next/link';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbItem {
    label: string;
    href: string;
}

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: React.ReactNode;
}

const PageHeader = ({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) => {
    return (
        <div className="flex flex-col gap-2">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb) => (
                            <React.Fragment key={crumb.href}>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={crumb.href}>{crumb.label}</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                            </React.Fragment>
                        ))}
                        <BreadcrumbItem>
                            <BreadcrumbPage>{title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="pb-2">{title}</h1>
                    {subtitle && <h5 className="text-muted-foreground">{subtitle}</h5>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
};

export default PageHeader;
