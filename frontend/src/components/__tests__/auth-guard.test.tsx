import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthGuard } from '../auth-guard';

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockNavigateTo = jest.fn();

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
    signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
}));

jest.mock('@/lib/navigation', () => ({
    navigateTo: (...args: unknown[]) => mockNavigateTo(...args),
}));

import { useSession } from 'next-auth/react';
const mockUseSession = useSession as jest.Mock;

describe('AuthGuard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders children when session is valid', () => {
        mockUseSession.mockReturnValue({
            data: { accessToken: 'valid-token' },
            status: 'authenticated',
        });

        render(<AuthGuard><div>Protected Content</div></AuthGuard>);
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders nothing while loading', () => {
        mockUseSession.mockReturnValue({ data: null, status: 'loading' });

        const { container } = render(<AuthGuard><div>Protected Content</div></AuthGuard>);
        expect(container.innerHTML).toBe('');
    });

    it('calls signOut with redirect: false on RefreshTokenError', async () => {
        mockUseSession.mockReturnValue({
            data: { error: 'RefreshTokenError' },
            status: 'authenticated',
        });

        render(<AuthGuard><div>Protected Content</div></AuthGuard>);

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
        });
    });

    it('does not call signOut with callbackUrl option', async () => {
        mockUseSession.mockReturnValue({
            data: { error: 'RefreshTokenError' },
            status: 'authenticated',
        });

        render(<AuthGuard><div>Protected Content</div></AuthGuard>);

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled();
        });

        const callArgs = mockSignOut.mock.calls[0][0];
        expect(callArgs).not.toHaveProperty('callbackUrl');
    });

    it('redirects to clean login URL with SessionExpired and callbackUrl after signOut', async () => {
        mockUseSession.mockReturnValue({
            data: { error: 'RefreshTokenError' },
            status: 'authenticated',
        });

        render(<AuthGuard><div>Protected Content</div></AuthGuard>);

        await waitFor(() => {
            expect(mockNavigateTo).toHaveBeenCalledWith('/login?error=SessionExpired&callbackUrl=%2Fdashboard');
        });
    });

    it('renders nothing when session has RefreshTokenError', () => {
        mockUseSession.mockReturnValue({
            data: { error: 'RefreshTokenError' },
            status: 'authenticated',
        });

        const { container } = render(<AuthGuard><div>Protected Content</div></AuthGuard>);
        expect(container.innerHTML).toBe('');
    });
});
