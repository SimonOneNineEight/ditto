import { useEffect, useRef, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
    callback: () => void,
    enabled: boolean = true
): RefObject<T> {
    const ref = useRef<T>(null);

    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [callback, enabled]);

    return ref;
}
