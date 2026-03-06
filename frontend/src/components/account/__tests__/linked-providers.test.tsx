import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkedProviders } from '../linked-providers';

const mockGetLinkedProviders = jest.fn();
const mockUnlinkProvider = jest.fn();
const mockLinkProvider = jest.fn();

jest.mock('@/services/account-service', () => ({
    accountService: {
        getLinkedProviders: (...args: unknown[]) => mockGetLinkedProviders(...args),
        unlinkProvider: (...args: unknown[]) => mockUnlinkProvider(...args),
        linkProvider: (...args: unknown[]) => mockLinkProvider(...args),
        setPassword: jest.fn(),
        changePassword: jest.fn(),
    },
}));

jest.mock('next-auth/react', () => ({
    signIn: jest.fn(),
}));

jest.mock('@icons-pack/react-simple-icons', () => ({
    SiGithub: () => <svg data-testid="icon-github" />,
    SiGoogle: () => <svg data-testid="icon-google" />,
}));

jest.mock('lucide-react', () => {
    const actual = jest.requireActual('lucide-react');
    return {
        ...actual,
        Info: () => <svg data-testid="icon-info" />,
        Linkedin: () => <svg data-testid="icon-linkedin" />,
        Loader2: ({ className }: { className?: string }) => <svg data-testid="loader" className={className} />,
        Lock: () => <svg data-testid="icon-lock" />,
    };
});

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

describe('LinkedProviders', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders linked providers with unlink buttons', async () => {
        mockGetLinkedProviders.mockResolvedValue([
            { auth_provider: 'github', created_at: '2024-01-01T00:00:00Z' },
            { auth_provider: 'google', created_at: '2024-01-01T00:00:00Z' },
            { auth_provider: 'local', created_at: '2024-01-01T00:00:00Z' },
        ]);

        render(<LinkedProviders />);

        await waitFor(() => {
            expect(screen.getByText(/GitHub/)).toBeInTheDocument();
        });

        expect(screen.getByText(/GitHub.*Linked/)).toBeInTheDocument();
        expect(screen.getByText(/Google.*Linked/)).toBeInTheDocument();
        expect(screen.getByText(/LinkedIn.*Not linked/)).toBeInTheDocument();
    });

    it('shows link buttons for unlinked providers', async () => {
        mockGetLinkedProviders.mockResolvedValue([
            { auth_provider: 'github', created_at: '2024-01-01T00:00:00Z' },
            { auth_provider: 'local', created_at: '2024-01-01T00:00:00Z' },
        ]);

        render(<LinkedProviders />);

        await waitFor(() => {
            expect(screen.getByText('Link Google')).toBeInTheDocument();
        });

        expect(screen.getByText('Link LinkedIn')).toBeInTheDocument();
    });

    it('disables unlink button when only one method remains', async () => {
        mockGetLinkedProviders.mockResolvedValue([
            { auth_provider: 'github', created_at: '2024-01-01T00:00:00Z' },
        ]);

        render(<LinkedProviders />);

        await waitFor(() => {
            expect(screen.getByText(/GitHub.*Linked/)).toBeInTheDocument();
        });

        const unlinkButton = screen.getByRole('button', { name: /unlink/i });
        expect(unlinkButton).toBeDisabled();

        expect(screen.getByText('This is your only login method')).toBeInTheDocument();
    });

    it('shows unlink confirmation dialog', async () => {
        mockGetLinkedProviders.mockResolvedValue([
            { auth_provider: 'github', created_at: '2024-01-01T00:00:00Z' },
            { auth_provider: 'google', created_at: '2024-01-01T00:00:00Z' },
        ]);

        const user = userEvent.setup();
        render(<LinkedProviders />);

        await waitFor(() => {
            expect(screen.getByText(/GitHub.*Linked/)).toBeInTheDocument();
        });

        const unlinkButtons = screen.getAllByRole('button', { name: /^unlink$/i });
        await user.click(unlinkButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(/You will no longer be able to sign in with github/i)).toBeInTheDocument();
        });
    });

    it('renders password section with set mode when no password', async () => {
        mockGetLinkedProviders.mockResolvedValue([
            { auth_provider: 'github', created_at: '2024-01-01T00:00:00Z' },
            { auth_provider: 'google', created_at: '2024-01-01T00:00:00Z' },
        ]);

        render(<LinkedProviders />);

        await waitFor(() => {
            expect(screen.getByText('Set Password')).toBeInTheDocument();
        });

        expect(screen.getByText(/No password set/)).toBeInTheDocument();
    });

    it('renders password section with change mode when password exists', async () => {
        mockGetLinkedProviders.mockResolvedValue([
            { auth_provider: 'github', created_at: '2024-01-01T00:00:00Z' },
            { auth_provider: 'local', created_at: '2024-01-01T00:00:00Z' },
        ]);

        render(<LinkedProviders />);

        await waitFor(() => {
            expect(screen.getByText('Change Password')).toBeInTheDocument();
        });

        expect(screen.getByText(/Password is set/)).toBeInTheDocument();
    });
});
