'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import api from '@/lib/axios';
import { FormLabel, FormFieldWrapper } from './form-label';

interface CompanySuggestion {
    id?: string;
    name: string;
    domain?: string;
    logo_url?: string;
    website?: string;
    source: 'local' | 'external';
}

interface CompanySelection {
    id?: string;
    name: string;
    domain?: string;
    logoUrl?: string;
    website?: string;
}

interface CompanyAutocompleteProps {
    value?: CompanySelection;
    onChange: (company: CompanySelection) => void;
}

const CompanyAutocomplete = ({ value, onChange }: CompanyAutocompleteProps) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value?.name || '');
    const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync query with external value changes (e.g., from URL import)
    useEffect(() => {
        if (value?.name) {
            setQuery(value.name);
        }
    }, [value?.name]);

    const fetchSuggestions = useCallback(async (input: string) => {
        if (input.length < 2) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.get('/api/companies/autocomplete', {
                params: { q: input },
            });
            setSuggestions(response.data?.data?.suggestions || []);
        } catch {
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query) fetchSuggestions(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, fetchSuggestions]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset highlight when suggestions change
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [suggestions]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || suggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                    handleSelect(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setOpen(false);
                break;
        }
    };

    const handleSelect = (suggestion: CompanySuggestion) => {
        onChange({
            id: suggestion.id,
            name: suggestion.name,
            domain: suggestion.domain,
            logoUrl: suggestion.logo_url,
            website: suggestion.website,
        });
        setQuery(suggestion.name);
        setOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setQuery(input);
        setOpen(true);
        onChange({ name: input });
    };

    return (
        <FormFieldWrapper>
            <FormLabel required>Company</FormLabel>
            <div ref={containerRef} className="relative">
                <div className="flex items-center gap-2">
                    {value?.logoUrl && (
                        <img
                            src={value.logoUrl}
                            alt=""
                            className="w-5 h-5 rounded object-contain"
                        />
                    )}
                    <Input
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => setOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder="Company name"
                        className="flex-1"
                    />
                </div>

                {open && (suggestions.length > 0 || isLoading) && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 py-1 rounded-md bg-background border border-border/40 shadow-sm max-h-[280px] overflow-auto">
                        {isLoading && (
                            <div className="px-3 py-1.5 text-sm text-muted-foreground/60">
                                Searching...
                            </div>
                        )}
                        {!isLoading && suggestions.map((suggestion, index) => (
                            <div
                                key={suggestion.id || `${suggestion.name}-${index}`}
                                onClick={() => handleSelect(suggestion)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer transition-colors ${
                                    index === highlightedIndex ? 'bg-muted/40' : 'hover:bg-muted/20'
                                }`}
                            >
                                {suggestion.logo_url ? (
                                    <img
                                        src={suggestion.logo_url}
                                        alt=""
                                        className="w-5 h-5 rounded object-contain"
                                    />
                                ) : (
                                    <div className="w-5 h-5 rounded bg-muted/40 flex items-center justify-center text-[10px] font-medium text-muted-foreground/60">
                                        {suggestion.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span className="text-sm truncate">{suggestion.name}</span>
                                {suggestion.domain && (
                                    <span className="text-xs text-muted-foreground/40 truncate">
                                        {suggestion.domain}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FormFieldWrapper>
    );
};

export default CompanyAutocomplete;
