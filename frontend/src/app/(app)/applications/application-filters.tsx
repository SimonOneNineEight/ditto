'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Search, X, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
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
    type SortColumn,
    type SortOrder,
} from '@/services/application-service';

const SORT_OPTIONS: { value: SortColumn; label: string }[] = [
    { value: 'applied_at', label: 'Applied Date' },
    { value: 'updated_at', label: 'Last Updated' },
    { value: 'company', label: 'Company' },
    { value: 'position', label: 'Position' },
    { value: 'status', label: 'Status' },
];

interface MobileFilterSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    statuses: ApplicationStatus[];
    currentFilters: Filters;
    selectedStatusIds: string[];
    hasActiveFilters: boolean;
    onStatusToggle: (statusId: string) => void;
    onDateFromChange: (date: Date | undefined) => void;
    onDateToChange: (date: Date | undefined) => void;
    onHasInterviewsChange: (checked: boolean) => void;
    onHasAssessmentsChange: (checked: boolean) => void;
    onFilterChange: (filters: Filters) => void;
    onClear: () => void;
    parseDateString: (dateStr: string | undefined) => Date | undefined;
}

const MobileFilterSheet = memo(function MobileFilterSheet({
    open,
    onOpenChange,
    statuses,
    currentFilters,
    selectedStatusIds,
    hasActiveFilters,
    onStatusToggle,
    onDateFromChange,
    onDateToChange,
    onHasInterviewsChange,
    onHasAssessmentsChange,
    onFilterChange,
    onClear,
    parseDateString,
}: MobileFilterSheetProps) {
    return (
        <div
            className={cn(
                "fixed inset-0 z-50 transition-all duration-300",
                open ? "pointer-events-auto" : "pointer-events-none"
            )}
        >
            {/* Overlay */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/50 transition-opacity duration-300",
                    open ? "opacity-100" : "opacity-0"
                )}
                onClick={() => onOpenChange(false)}
            />
            {/* Sheet content */}
            <div
                className={cn(
                    "absolute inset-x-0 bottom-0 h-[85vh] rounded-t-xl border-t bg-background shadow-lg flex flex-col transition-transform duration-300 ease-out px-4",
                    open ? "translate-y-0" : "translate-y-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b pt-4">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 space-y-6">
                    {/* Status filter */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Status</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {(statuses || []).map((status) => {
                                const isSelected = selectedStatusIds.includes(status.id);
                                return (
                                    <Button
                                        key={status.id}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => onStatusToggle(status.id)}
                                        className="rounded-full"
                                    >
                                        {status.name}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date range */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Date Range</label>
                        <div className="flex items-center gap-2">
                            <DatePicker
                                value={parseDateString(currentFilters.date_from)}
                                onChange={onDateFromChange}
                                placeholder="From"
                                className="flex-1"
                            />
                            <span className="text-muted-foreground text-sm">to</span>
                            <DatePicker
                                value={parseDateString(currentFilters.date_to)}
                                onChange={onDateToChange}
                                placeholder="To"
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {/* Toggle filters */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Activity</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <Button
                                variant={currentFilters.has_interviews ? "default" : "outline"}
                                size="sm"
                                onClick={() => onHasInterviewsChange(!currentFilters.has_interviews)}
                                className="rounded-full"
                            >
                                Interviews
                            </Button>
                            <Button
                                variant={currentFilters.has_assessments ? "default" : "outline"}
                                size="sm"
                                onClick={() => onHasAssessmentsChange(!currentFilters.has_assessments)}
                                className="rounded-full"
                            >
                                Assessments
                            </Button>
                        </div>
                    </div>

                    {/* Sort options */}
                    <div>
                        <label className="text-sm font-medium mb-1 block">Sort By</label>
                        <div className="space-y-1">
                            {SORT_OPTIONS.map((option) => {
                                const isSelected = currentFilters.sort_by === option.value;
                                const isAsc = isSelected && currentFilters.sort_order === 'asc';
                                return (
                                    <Button
                                        key={option.value}
                                        variant="ghost"
                                        onClick={() => {
                                            let newOrder: SortOrder = 'desc';
                                            if (isSelected) {
                                                newOrder = currentFilters.sort_order === 'desc' ? 'asc' : 'desc';
                                            }
                                            onFilterChange({
                                                ...currentFilters,
                                                sort_by: option.value,
                                                sort_order: newOrder,
                                            });
                                        }}
                                        className={cn(
                                            "flex items-center justify-between w-full h-9 px-3",
                                            isSelected && "bg-muted"
                                        )}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && (
                                            <span className="text-xs text-muted-foreground">
                                                {isAsc ? '↑ Oldest first' : '↓ Newest first'}
                                            </span>
                                        )}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-auto border-t pt-4 pb-4">
                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => {
                                onClear();
                                onOpenChange(false);
                            }}
                            className="flex-1"
                            disabled={!hasActiveFilters}
                        >
                            Clear All
                        </Button>
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});

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
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    const activeFilterCount = [
        currentFilters.status_ids?.length ? 1 : 0,
        currentFilters.date_from || currentFilters.date_to ? 1 : 0,
        currentFilters.has_interviews ? 1 : 0,
        currentFilters.has_assessments ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

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

    const selectedStatusIds = useMemo(
        () => currentFilters.status_ids || [],
        [currentFilters.status_ids]
    );

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

    const parseDateString = useCallback((dateStr: string | undefined): Date | undefined => {
        if (!dateStr) return undefined;
        return parse(dateStr, 'yyyy-MM-dd', new Date());
    }, []);

    const getSelectedStatusLabel = () => {
        if (selectedStatusIds.length === 0) return 'All Statuses';
        if (selectedStatusIds.length === 1) return getStatusName(selectedStatusIds[0]);
        return `${selectedStatusIds.length} statuses`;
    };

    const showCount = total !== undefined && filteredCount !== undefined;

    return (
        <div className="space-y-3">
            {/* Mobile: Compact search + filter button */}
            <div className="md:hidden">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2.5 border-b border-border py-1 flex-1">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search company..."
                            value={companyInput}
                            onChange={(e) => setCompanyInput(e.target.value)}
                            className="border-0 p-0 h-auto flex-1"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMobileFilterOpen(true)}
                        className="relative flex-shrink-0"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="ml-1.5">Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>

                <MobileFilterSheet
                    open={mobileFilterOpen}
                    onOpenChange={setMobileFilterOpen}
                    statuses={statuses}
                    currentFilters={currentFilters}
                    selectedStatusIds={selectedStatusIds}
                    hasActiveFilters={hasActiveFilters}
                    onStatusToggle={handleStatusToggle}
                    onDateFromChange={handleDateFromChange}
                    onDateToChange={handleDateToChange}
                    onHasInterviewsChange={handleHasInterviewsChange}
                    onHasAssessmentsChange={handleHasAssessmentsChange}
                    onFilterChange={onFilterChange}
                    onClear={onClear}
                    parseDateString={parseDateString}
                />
            </div>

            {/* Tablet/Desktop: Filter rows */}
            <div className="hidden md:flex flex-col gap-3">
                {/* Row 1: Search, Status, Date range */}
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
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 w-[160px] h-auto text-sm border-0 border-b border-border rounded-none px-0 py-1 justify-between hover:bg-transparent"
                            >
                                <span className={cn(
                                    "flex-1 truncate text-left",
                                    selectedStatusIds.length === 0 && "text-muted-foreground"
                                )}>
                                    {getSelectedStatusLabel()}
                                </span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-2" align="start">
                            <div className="space-y-1">
                                {(statuses || []).map((status) => {
                                    const isSelected = selectedStatusIds.includes(status.id);
                                    return (
                                        <Button
                                            key={status.id}
                                            variant="ghost"
                                            onClick={() => handleStatusToggle(status.id)}
                                            className={cn(
                                                "flex items-center gap-2 w-full px-2 py-1.5 h-auto text-sm justify-start",
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
                                        </Button>
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
                </div>

                {/* Row 2: Checkboxes */}
                <div className="flex items-center gap-3">
                    {/* Has interviews checkbox */}
                    <Button
                        variant="ghost"
                        onClick={() => handleHasInterviewsChange(!currentFilters.has_interviews)}
                        className="flex items-center gap-2 text-sm h-auto px-2 py-1"
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
                    </Button>

                    {/* Has assessments checkbox */}
                    <Button
                        variant="ghost"
                        onClick={() => handleHasAssessmentsChange(!currentFilters.has_assessments)}
                        className="flex items-center gap-2 text-sm h-auto px-2 py-1"
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
                    </Button>
                </div>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-2">
                {selectedStatusIds.map((statusId) => (
                    <Badge key={statusId} variant="secondary" className="gap-1 pr-1 rounded-full">
                        Status: {getStatusName(statusId)}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStatusFilter(statusId)}
                            className="ml-1 h-4 w-4 p-0 hover:bg-muted rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                ))}
                {currentFilters.company_name && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        Company: {currentFilters.company_name}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter('company_name')}
                            className="ml-1 h-4 w-4 p-0 hover:bg-muted rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}
                {currentFilters.date_from && currentFilters.date_to && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        {currentFilters.date_from} – {currentFilters.date_to}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                removeFilter('date_from');
                                removeFilter('date_to');
                            }}
                            className="ml-1 h-4 w-4 p-0 hover:bg-muted rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}
                {currentFilters.date_from && !currentFilters.date_to && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        From: {currentFilters.date_from}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter('date_from')}
                            className="ml-1 h-4 w-4 p-0 hover:bg-muted rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}
                {currentFilters.date_to && !currentFilters.date_from && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        Until: {currentFilters.date_to}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter('date_to')}
                            className="ml-1 h-4 w-4 p-0 hover:bg-muted rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}
                {currentFilters.has_interviews && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        Has Interviews
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter('has_interviews')}
                            className="ml-1 h-4 w-4 p-0 hover:bg-muted rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}
                {currentFilters.has_assessments && (
                    <Badge variant="secondary" className="gap-1 pr-1 rounded-full">
                        Has Assessments
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFilter('has_assessments')}
                            className="ml-1 h-4 w-4 p-0 hover:bg-muted rounded-full"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                )}
                {hasActiveFilters && (
                    <Button
                        variant="link"
                        onClick={onClear}
                        className="text-sm font-medium h-auto p-0"
                    >
                        Clear all
                    </Button>
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
