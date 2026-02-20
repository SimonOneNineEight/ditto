'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { ApplicationFilters } from '@/services/application-service';
import { exportApplications, exportInterviews, exportBoth } from '@/services/exportService';

export type ExportType = 'applications' | 'interviews' | 'both';

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters?: ApplicationFilters;
  totalFiltered?: number;
  totalAll?: number;
}

export function ExportDialog({
  open,
  onOpenChange,
  filters,
  totalFiltered,
  totalAll,
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('applications');
  const [ignoreFilters, setIgnoreFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const hasActiveFilters = filters && Object.keys(filters).some((key) => {
    const value = filters[key as keyof ApplicationFilters];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return true;
    return value !== undefined && value !== '';
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportFilters = ignoreFilters ? undefined : filters;

      switch (exportType) {
        case 'applications':
          await exportApplications(exportFilters);
          toast.success('Applications exported successfully');
          break;
        case 'interviews':
          await exportInterviews(exportFilters);
          toast.success('Interviews exported successfully');
          break;
        case 'both':
          await exportBoth(exportFilters);
          toast.success('Applications and interviews exported successfully');
          break;
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getExportDescription = () => {
    if (!hasActiveFilters || ignoreFilters) {
      return totalAll ? `Export all ${totalAll} records` : 'Export all data';
    }
    return totalFiltered !== undefined
      ? `Export ${totalFiltered} of ${totalAll ?? 'all'} records matching your filters`
      : 'Export filtered data';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export your job search data to CSV format for analysis or backup.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="export-type">Export Type</Label>
            <Select
              value={exportType}
              onValueChange={(value) => setExportType(value as ExportType)}
            >
              <SelectTrigger id="export-type">
                <SelectValue placeholder="Select export type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applications">Applications Only</SelectItem>
                <SelectItem value="interviews">Interviews Only</SelectItem>
                <SelectItem value="both">Both (2 files)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="ignore-filters" className="text-sm font-medium">
                  Include all data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ignore current filters and export everything
                </p>
              </div>
              <Switch
                id="ignore-filters"
                checked={ignoreFilters}
                onCheckedChange={setIgnoreFilters}
              />
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              {getExportDescription()}
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
