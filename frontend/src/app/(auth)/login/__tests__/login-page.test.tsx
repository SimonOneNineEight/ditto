import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('next/font/google', () => ({
    Suez_One: () => ({ className: 'mock-font' }),
}));

const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => mockSearchParams,
}));

const mockSignIn = jest.fn();

jest.mock('next-auth/react', () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
}));

import LoginPage from '../page';

describe('LoginPage - Session Expiry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSearchParams = new URLSearchParams();
    });

    it('displays session expired message when error=SessionExpired', () => {
        mockSearchParams = new URLSearchParams('error=SessionExpired');

        render(<LoginPage />);

        expect(
            screen.getByText('Your session has expired. Please sign in again.')
        ).toBeInTheDocument();
    });

    it('does not display error message when no error param', () => {
        render(<LoginPage />);

        expect(
            screen.queryByText('Your session has expired. Please sign in again.')
        ).not.toBeInTheDocument();
    });

    it('clears session expired error when user focuses a form field', async () => {
        const user = userEvent.setup();
        mockSearchParams = new URLSearchParams('error=SessionExpired');

        render(<LoginPage />);

        expect(
            screen.getByText('Your session has expired. Please sign in again.')
        ).toBeInTheDocument();

        await user.click(screen.getByTestId('login-email'));

        await waitFor(() => {
            expect(
                screen.queryByText('Your session has expired. Please sign in again.')
            ).not.toBeInTheDocument();
        });
    });

    it('redirects to callbackUrl after successful login', async () => {
        const user = userEvent.setup();
        mockSearchParams = new URLSearchParams(
            'error=SessionExpired&callbackUrl=/applications'
        );
        mockSignIn.mockResolvedValue({ error: null });

        render(<LoginPage />);

        await user.type(screen.getByTestId('login-email'), 'test@example.com');
        await user.type(screen.getByTestId('login-password'), 'password123');
        await user.click(screen.getByTestId('login-submit'));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/applications');
        });
    });

    it('rejects external callbackUrl and defaults to /', async () => {
        const user = userEvent.setup();
        mockSearchParams = new URLSearchParams(
            'callbackUrl=https://evil.com/steal'
        );
        mockSignIn.mockResolvedValue({ error: null });

        render(<LoginPage />);

        await user.type(screen.getByTestId('login-email'), 'test@example.com');
        await user.type(screen.getByTestId('login-password'), 'password123');
        await user.click(screen.getByTestId('login-submit'));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('redirects to / when no callbackUrl param', async () => {
        const user = userEvent.setup();
        mockSignIn.mockResolvedValue({ error: null });

        render(<LoginPage />);

        await user.type(screen.getByTestId('login-email'), 'test@example.com');
        await user.type(screen.getByTestId('login-password'), 'password123');
        await user.click(screen.getByTestId('login-submit'));

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });
});
