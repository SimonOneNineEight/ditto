'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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
    total?: number;
    filteredCount?: number;
}

export function ApplicationFilters({
    statuses,
    currentFilters,
    onFilterChange,
    onClear,
    hasActiveFilters,
    total,
    filteredCount,
}: ApplicationFiltersProps) {
    const [companyInput, setCompanyInput] = useState(currentFilters.company_name || '');
    const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);

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

    const selectedStatusIds = currentFilters.status_ids || [];

    const handleStatusToggle = useCallback((statusId: string) => {
        const currentIds = currentFilters.status_ids || [];
        let newIds: string[];

        if (currentIds.includes(statusId)) {
            newIds = currentIds.filter(id => id !== statusId);
        } else {
            newIds = [...currentIds, statusId];
        }

        onFilterChange({
            ...currentFilters,
            status_id: undefined,
            status_ids: newIds.length > 0 ? newIds : undefined,
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

    const handleHasInterviewsChange = useCallback((checked: boolean) => {
        onFilterChange({
            ...currentFilters,
            has_interviews: checked ? true : undefined,
        });
    }, [currentFilters, onFilterChange]);

    const handleHasAssessmentsChange = useCallback((checked: boolean) => {
        onFilterChange({
            ...currentFilters,
            has_assessments: checked ? true : undefined,
        });
    }, [currentFilters, onFilterChange]);

    const removeFilter = useCallback((key: keyof Filters | 'status_ids') => {
        const updated = { ...currentFilters };
        if (key === 'company_name') {
            setCompanyInput('');
            delete updated.company_name;
        } else if (key === 'status_ids') {
            delete updated.status_ids;
            delete updated.status_id;
        } else {
            delete updated[key as keyof Filters];
        }
        onFilterChange(updated);
    }, [currentFilters, onFilterChange]);

    const removeStatusFilter = useCallback((statusId: string) => {
        const currentIds = currentFilters.status_ids || [];
        const newIds = currentIds.filter(id => id !== statusId);
        onFilterChange({
            ...currentFilters,
            status_ids: newIds.length > 0 ? newIds : undefined,
        });
    }, [currentFilters, onFilterChange]);

    const getStatusName = (id: string) => {
        return statuses.find(s => s.id === id)?.name || id;
    };

    const parseDateString = (dateStr: string | undefined): Date | undefined => {
        if (!dateStr) return undefined;
        return parse(dateStr, 'yyyy-MM-dd', new Date());
    };

    const getSelectedStatusLabel = () => {
        if (selectedStatusIds.length === 0) return 'All Statuses';
        if (selectedStatusIds.length === 1) return getStatusName(selectedStatusIds[0]);
        return `${selectedStatusIds.length} statuses`;
    };

    const showCount = total !== undefined && filteredCount !== undefined;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                {/* Company search */}
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

                {/* Multi-select status filter */}
                <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className="flex items-center gap-2 w-[160px] h-auto text-sm border-0 border-b border-border bg-transparent px-0 py-1 text-left"
                        >
                            <span className={cn(
                                "flex-1 truncate",
                                selectedStatusIds.length === 0 && "text-muted-foreground"
                            )}>
                                {getSelectedStatusLabel()}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-2" align="start">
                        <div className="space-y-1">
                            {(statuses || []).map((status) => {
                                const isSelected = selectedStatusIds.includes(status.id);
                                return (
                                    <button
                                        key={status.id}
                                        onClick={() => handleStatusToggle(status.id)}
                                        className={cn(
                                            "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-muted",
                                            isSelected && "bg-muted"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-4 w-4 items-center justify-center rounded-sm border",
                                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                                        )}>
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </div>
                                        <span>{status.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Date range */}
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

                {/* Has interviews checkbox */}
                <button
                    onClick={() => handleHasInterviewsChange(!currentFilters.has_interviews)}
                    className="flex items-center gap-2 text-sm"
                >
                    <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                        currentFilters.has_interviews
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground"
                    )}>
                        {currentFilters.has_interviews && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-muted-foreground">Has Interviews</span>
                </button>

                {/* Has assessments checkbox */}
                <button
                    onClick={() => handleHasAssessmentsChange(!currentFilters.has_assessments)}
                    className="flex items-center gap-2 text-sm"
                >
                    <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                        currentFilters.has_assessments
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground"
                    )}>
                        {currentFilters.has_assessments && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-muted-foreground">Has Assessments</span>
                </button>

            </div>

            {/* Filter count and chips */}
            <div className="flex flex-wrap items-center gap-2">
                {showCount && (
                    <span className="text-sm text-muted-foreground">
                        Showing {filteredCount} of {total} applications
                    </span>
                )}
                {showCount && hasActiveFilters && (
                    <span className="text-border">|</span>
                )}

                {selectedStatusIds.map((statusId) => (
                    <Badge key={statusId} variant="secondary" className="gap-1 pr-1 rounded-full">
                        Status: {getStatusName(statusId)}
                        <button
                            onClick={() => removeStatusFilter(statusId)}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                {currentFilters.company_name && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        Company: {currentFilters.company_name}
                        <button
                            onClick={() => removeFilter('company_name')}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
                {currentFilters.date_from && currentFilters.date_to && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        {currentFilters.date_from} – {currentFilters.date_to}
                        <button
                            onClick={() => {
                                removeFilter('date_from');
                                removeFilter('date_to');
                            }}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
                {currentFilters.date_from && !currentFilters.date_to && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        From: {currentFilters.date_from}
                        <button
                            onClick={() => removeFilter('date_from')}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
                {currentFilters.date_to && !currentFilters.date_from && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        Until: {currentFilters.date_to}
                        <button
                            onClick={() => removeFilter('date_to')}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
                {currentFilters.has_interviews && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        Has Interviews
                        <button
                            onClick={() => removeFilter('has_interviews')}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
                {currentFilters.has_assessments && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        Has Assessments
                        <button
                            onClick={() => removeFilter('has_assessments')}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
                {hasActiveFilters && (
                    <button
                        onClick={onClear}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Empty state message */}
            {hasActiveFilters && filteredCount === 0 && (
                <div className="text-sm text-muted-foreground py-2">
                    No applications match your filters. Try adjusting your criteria.
                </div>
            )}
        </div>
    );
}
