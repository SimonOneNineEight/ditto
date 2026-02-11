'use client';

import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u',
    'ul', 'ol', 'li',
    'a',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre',
    'span', 'div',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export function sanitizeHtml(dirty: string): string {
    if (typeof window === 'undefined') {
        return dirty;
    }

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ADD_ATTR: ['rel'],
        FORCE_BODY: true,
    });
}
