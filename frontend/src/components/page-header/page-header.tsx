'use client';

import React from 'react';
import Link from 'next/link';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbItem {
    label: string;
    href: string;
}

export interface PageHeaderProps {
    title: string;
    titleExtra?: React.ReactNode;
    subtitle?: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    actions?: React.ReactNode;
}

const PageHeader = ({ title, titleExtra, subtitle, breadcrumbs, actions }: PageHeaderProps) => {
    return (
        <div className="flex flex-col gap-6 mb-6">
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
                    </BreadcrumbList>
                </Breadcrumb>
            )}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-[28px] font-semibold tracking-[-0.02em] leading-tight">{title}</h1>
                        {titleExtra}
                    </div>
                    {subtitle && (
                        typeof subtitle === 'string'
                            ? <p className="text-sm text-muted-foreground">{subtitle}</p>
                            : subtitle
                    )}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
        </div>
    );
};

export default PageHeader;
