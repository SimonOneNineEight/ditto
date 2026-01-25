'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
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

    // Sync company input with URL params on external changes
    useEffect(() => {
        setCompanyInput(currentFilters.company_name || '');
    }, [currentFilters.company_name]);

    // Debounced company name filter
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

    const handleDateFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({
            ...currentFilters,
            date_from: e.target.value || undefined,
        });
    }, [currentFilters, onFilterChange]);

    const handleDateToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({
            ...currentFilters,
            date_to: e.target.value || undefined,
        });
    }, [currentFilters, onFilterChange]);

    const removeFilter = useCallback((key: keyof Filters) => {
        const updated = { ...currentFilters };
        delete updated[key];
        if (key === 'company_name') setCompanyInput('');
        onFilterChange(updated);
    }, [currentFilters, onFilterChange]);

    // Get status name by ID
    const getStatusName = (id: string) => {
        return statuses.find(s => s.id === id)?.name || id;
    };

    return (
        <div className="mb-4 space-y-3">
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <Select
                    value={currentFilters.status_id || 'all'}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger className="w-[160px] h-9 text-sm">
                        <SelectValue placeholder="Status" />
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

                <Input
                    placeholder="Search company..."
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    className="w-[180px] h-9 text-sm"
                />

                <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        value={currentFilters.date_from || ''}
                        onChange={handleDateFromChange}
                        className="w-[140px] h-9 text-sm"
                        placeholder="From"
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <Input
                        type="date"
                        value={currentFilters.date_to || ''}
                        onChange={handleDateToChange}
                        className="w-[140px] h-9 text-sm"
                        placeholder="To"
                    />
                </div>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClear}
                        className="h-9 text-xs"
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Active Filter Chips */}
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
