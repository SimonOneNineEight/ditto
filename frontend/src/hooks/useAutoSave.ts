'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface UseAutoSaveOptions {
    debounceMs?: number;
    enabled?: boolean;
}

export interface UseAutoSaveReturn {
    status: AutoSaveStatus;
    lastSaved: Date | null;
    retry: () => void;
    flush: () => void;
}

export const useAutoSave = <T>(
    data: T,
    saveFunction: (data: T) => Promise<void>,
    options?: UseAutoSaveOptions
): UseAutoSaveReturn => {
    const { debounceMs = 30000, enabled = true } = options ?? {};

    const [status, setStatus] = useState<AutoSaveStatus>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const previousDataRef = useRef<T>(data);
    const pendingDataRef = useRef<T>(data);
    const saveFunctionRef = useRef(saveFunction);

    saveFunctionRef.current = saveFunction;

    const hasChanged = useMemo(() => {
        return JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    }, [data]);

    const performSave = useCallback(async (dataToSave: T) => {
        const currentData = JSON.stringify(dataToSave);
        if (currentData === JSON.stringify(previousDataRef.current)) {
            return;
        }

        setStatus('saving');
        try {
            await saveFunctionRef.current(dataToSave);
            previousDataRef.current = dataToSave;
            setLastSaved(new Date());
            setStatus('saved');
        } catch {
            setStatus('error');
        }
    }, []);

    const retry = useCallback(() => {
        performSave(pendingDataRef.current);
    }, [performSave]);

    const flush = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        performSave(pendingDataRef.current);
    }, [performSave]);

    useEffect(() => {
        pendingDataRef.current = data;
    }, [data]);

    useEffect(() => {
        if (!enabled || !hasChanged) {
            return;
        }

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            performSave(pendingDataRef.current);
        }, debounceMs);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [data, enabled, hasChanged, debounceMs, performSave]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                const currentData = JSON.stringify(pendingDataRef.current);
                const previousData = JSON.stringify(previousDataRef.current);
                if (currentData !== previousData) {
                    saveFunctionRef.current(pendingDataRef.current);
                }
            }
        };
    }, []);

    return { status, lastSaved, retry, flush };
};
