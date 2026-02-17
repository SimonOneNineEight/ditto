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
    href?: string;
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
        <div className="flex flex-col gap-4 desktop:gap-6 mb-4 desktop:mb-6">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.href || crumb.label}>
                                <BreadcrumbItem>
                                    {crumb.href ? (
                                        <BreadcrumbLink asChild>
                                            <Link href={crumb.href}>{crumb.label}</Link>
                                        </BreadcrumbLink>
                                    ) : (
                                        <span className="text-muted-foreground">{crumb.label}</span>
                                    )}
                                </BreadcrumbItem>
                                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
            <div className="flex flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 desktop:gap-3 flex-wrap">
                        <h1 className="text-xl sm:text-2xl desktop:text-[28px] font-semibold tracking-[-0.02em] leading-tight">{title}</h1>
                        {titleExtra}
                    </div>
                    {subtitle && (
                        typeof subtitle === 'string'
                            ? <p className="text-sm text-muted-foreground mt-0">{subtitle}</p>
                            : subtitle
                    )}
                </div>
                {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
            </div>
        </div>
    );
};

export default PageHeader;
