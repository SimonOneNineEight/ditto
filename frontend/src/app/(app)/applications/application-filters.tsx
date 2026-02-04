'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
    type ApplicationStatus,
    type ApplicationFilters as Filters,
} from '@/services/application-service';

interface ApplicationFiltersProps {
    statuses: ApplicationStatus[];
    currentFilters: Filters;
    onFilterChange: (filters: Filters) => void;
    onClear: () => void;
    hasActiveFilters: boolean;
}

export function ApplicationFilters({
    statuses,
    currentFilters,
    onFilterChange,
    onClear,
    hasActiveFilters,
}: ApplicationFiltersProps) {
    const [companyInput, setCompanyInput] = useState(currentFilters.company_name || '');

    useEffect(() => {
        setCompanyInput(currentFilters.company_name || '');
    }, [currentFilters.company_name]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            const trimmed = companyInput.trim();
            if (trimmed !== (currentFilters.company_name || '')) {
                onFilterChange({
                    ...currentFilters,
                    company_name: trimmed || undefined,
                });
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [companyInput]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStatusChange = useCallback((value: string) => {
        onFilterChange({
            ...currentFilters,
            status_id: value === 'all' ? undefined : value,
        });
    }, [currentFilters, onFilterChange]);

    const handleDateFromChange = useCallback((date: Date | undefined) => {
        onFilterChange({
            ...currentFilters,
            date_from: date ? format(date, 'yyyy-MM-dd') : undefined,
        });
    }, [currentFilters, onFilterChange]);

    const handleDateToChange = useCallback((date: Date | undefined) => {
        onFilterChange({
            ...currentFilters,
            date_to: date ? format(date, 'yyyy-MM-dd') : undefined,
        });
    }, [currentFilters, onFilterChange]);

    const removeFilter = useCallback((key: keyof Filters) => {
        const updated = { ...currentFilters };
        delete updated[key];
        if (key === 'company_name') setCompanyInput('');
        onFilterChange(updated);
    }, [currentFilters, onFilterChange]);

    const getStatusName = (id: string) => {
        return statuses.find(s => s.id === id)?.name || id;
    };

    const parseDateString = (dateStr: string | undefined): Date | undefined => {
        if (!dateStr) return undefined;
        return parse(dateStr, 'yyyy-MM-dd', new Date());
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2.5 w-[200px] border-b border-border py-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search company..."
                        value={companyInput}
                        onChange={(e) => setCompanyInput(e.target.value)}
                        className="border-0 p-0 h-auto"
                    />
                </div>

                <Select
                    value={currentFilters.status_id || 'all'}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger className="w-[160px] h-auto text-sm border-0 border-b border-border rounded-none bg-transparent px-0 py-1 focus:ring-0">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {(statuses || []).map((status) => (
                            <SelectItem key={status.id} value={status.id}>
                                {status.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                    <DatePicker
                        value={parseDateString(currentFilters.date_from)}
                        onChange={handleDateFromChange}
                        placeholder="From"
                        className="w-[140px]"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <DatePicker
                        value={parseDateString(currentFilters.date_to)}
                        onChange={handleDateToChange}
                        placeholder="To"
                        className="w-[140px]"
                    />
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="h-auto py-1 text-sm"
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    {currentFilters.status_id && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            Status: {getStatusName(currentFilters.status_id)}
                            <button
                                onClick={() => removeFilter('status_id')}
                                className="ml-1 rounded-full hover:bg-muted p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {currentFilters.company_name && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            Company: {currentFilters.company_name}
                            <button
                                onClick={() => removeFilter('company_name')}
                                className="ml-1 rounded-full hover:bg-muted p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {currentFilters.date_from && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            From: {currentFilters.date_from}
                            <button
                                onClick={() => removeFilter('date_from')}
                                className="ml-1 rounded-full hover:bg-muted p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    {currentFilters.date_to && (
                        <Badge variant="secondary" className="gap-1 pr-1">
                            Until: {currentFilters.date_to}
                            <button
                                onClick={() => removeFilter('date_to')}
                                className="ml-1 rounded-full hover:bg-muted p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
