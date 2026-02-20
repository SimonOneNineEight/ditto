import { AxiosError } from 'axios';

export interface ErrorResponse {
    success: false;
    error: {
        error: string;
        code: string;
        details?: string[];
        field_errors?: Record<string, string>;
    };
}

const ERROR_MESSAGES: Record<string, string> = {
    VALIDATION_FAILED: 'Please check your input and try again.',
    BAD_REQUEST: 'Invalid request. Please check your input.',
    UNAUTHORIZED: 'Session expired. Please log in again.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    FORBIDDEN: "You don't have access to this resource.",
    NOT_FOUND: 'The requested item was not found.',
    USER_NOT_FOUND: 'User not found.',
    CONFLICT: 'This resource already exists.',
    EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
    QUOTA_EXCEEDED: 'Storage quota exceeded. Please free up space.',
    INTERNAL_SERVER_ERROR: 'Something went wrong. Please try again.',
    DATABASE_ERROR: 'Something went wrong. Please try again.',
    UNEXPECTED_ERROR: 'Something went wrong. Please try again.',
    TIMEOUT_ERROR: 'The request timed out. Please try again.',
    NETWORK_FAILURE: 'Connection issue. Please check your network.',
};

export function getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        if (!error.response) {
            return 'Connection lost. Please check your network and try again.';
        }

        const data = error.response.data as ErrorResponse | undefined;
        if (data?.error?.code) {
            const mapped = ERROR_MESSAGES[data.error.code];
            if (mapped) return mapped;
        }

        if (data?.error?.error) {
            return data.error.error;
        }

        if (error.response.status === 401) {
            return ERROR_MESSAGES.UNAUTHORIZED;
        }
        if (error.response.status === 403) {
            return ERROR_MESSAGES.FORBIDDEN;
        }
        if (error.response.status === 404) {
            return ERROR_MESSAGES.NOT_FOUND;
        }
        if (error.response.status >= 500) {
            return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
        }
    }

    if (error instanceof Error) {
        if (error.message === 'Network Error') {
            return 'Connection lost. Please check your network and try again.';
        }
        return error.message;
    }

    return 'Something went wrong. Please try again.';
}

export function getErrorDetails(error: unknown): string[] | undefined {
    if (error instanceof AxiosError && error.response) {
        const data = error.response.data as ErrorResponse | undefined;
        return data?.error?.details;
    }
    return undefined;
}

export function isValidationError(error: unknown): boolean {
    if (!(error instanceof AxiosError) || !error.response) return false;
    const data = error.response.data as ErrorResponse | undefined;
    return data?.error?.code === 'VALIDATION_FAILED' && !!data?.error?.field_errors;
}

export function getFieldErrors(error: unknown): Record<string, string> | undefined {
    if (!(error instanceof AxiosError) || !error.response) return undefined;
    const data = error.response.data as ErrorResponse | undefined;
    return data?.error?.field_errors;
}
