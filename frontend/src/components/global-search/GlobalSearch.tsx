'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { search } from '@/services/searchService';
import { GroupedSearchResponse, SearchResult } from '@/types/search';
import { sanitizeHtml } from '@/lib/sanitizer';
import { Folder, Calendar, ClipboardList, FileText, Loader2, SearchX } from 'lucide-react';
import { format } from 'date-fns';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EMPTY_RESPONSE: GroupedSearchResponse = {
  applications: [],
  interviews: [],
  assessments: [],
  notes: [],
  total_count: 0,
  query: '',
};

const typeIcons = {
  application: Folder,
  interview: Calendar,
  assessment: ClipboardList,
  note: FileText,
};

const typeLabels = {
  application: 'Applications',
  interview: 'Interviews',
  assessment: 'Assessments',
  note: 'Notes',
};

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GroupedSearchResponse>(EMPTY_RESPONSE);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults(EMPTY_RESPONSE);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await search(searchQuery, 10);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults(EMPTY_RESPONSE);
      setHasSearched(false);
    }
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    router.push(result.link);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d');
    } catch {
      return '';
    }
  };

  const renderResult = (result: SearchResult) => {
    const Icon = typeIcons[result.type];

    return (
      <CommandItem
        key={`${result.type}-${result.id}`}
        value={`${result.type}-${result.id}-${result.title}`}
        onSelect={() => handleSelect(result)}
        className="flex items-center gap-3 px-4 py-2 rounded-md cursor-pointer data-[selected=true]:bg-muted"
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className="text-[13px] font-medium text-foreground truncate">
            {result.title}
          </span>
          <span
            className="text-xs text-muted-foreground truncate [&>b]:font-medium [&>b]:text-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.snippet) }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {formatDate(result.updated_at)}
        </span>
      </CommandItem>
    );
  };

  const renderGroup = (items: SearchResult[], type: keyof typeof typeLabels) => {
    if (items.length === 0) return null;

    return (
      <CommandGroup
        key={type}
        heading={typeLabels[type]}
        className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2"
      >
        {items.map(renderResult)}
      </CommandGroup>
    );
  };

  const hasResults = results.total_count > 0;
  const showEmpty = hasSearched && !isLoading && !hasResults && query.length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 gap-0 sm:rounded-xl sm:max-w-[560px] xl:max-w-[720px]">
        <Command className="rounded-xl" shouldFilter={false}>
          <CommandInput
            placeholder="Search applications, interviews, assessments..."
            value={query}
            onValueChange={setQuery}
            className="h-12"
          />

          <CommandList className="flex-1 sm:flex-none sm:max-h-[300px] overflow-y-auto p-2">
            {isLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {showEmpty && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 px-4">
                <SearchX className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  No results found for &apos;{query}&apos;.
                </p>
                <p className="text-[13px] text-muted-foreground">
                  Try different keywords.
                </p>
              </div>
            )}

            {!isLoading && hasResults && (
              <>
                {renderGroup(results.applications, 'application')}
                {renderGroup(results.interviews, 'interview')}
                {renderGroup(results.assessments, 'assessment')}
                {renderGroup(results.notes, 'note')}
              </>
            )}
          </CommandList>

          {/* Keyboard hints - hidden on mobile (touch users) */}
          <div className="hidden sm:flex items-center gap-4 px-4 py-2 border-t border-border">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded">
                esc
              </kbd>
              <span className="text-[11px] text-muted-foreground">close</span>
            </div>
            {hasResults && (
              <>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded">
                    ↑↓
                  </kbd>
                  <span className="text-[11px] text-muted-foreground">navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded">
                    ↵
                  </kbd>
                  <span className="text-[11px] text-muted-foreground">select</span>
                </div>
              </>
            )}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export default GlobalSearch;
