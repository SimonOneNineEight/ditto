import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordSection } from '../password-section';

const mockSetPassword = jest.fn();
const mockChangePassword = jest.fn();

jest.mock('@/services/account-service', () => ({
    accountService: {
        setPassword: (...args: unknown[]) => mockSetPassword(...args),
        changePassword: (...args: unknown[]) => mockChangePassword(...args),
    },
}));

jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

jest.mock('lucide-react', () => {
    const actual = jest.requireActual('lucide-react');
    return {
        ...actual,
        Lock: () => <svg data-testid="icon-lock" />,
        Loader2: ({ className }: { className?: string }) => <svg data-testid="loader" className={className} />,
    };
});

describe('PasswordSection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders "Set Password" button when no password', () => {
        render(<PasswordSection hasPassword={false} />);
        expect(screen.getByText('Set Password')).toBeInTheDocument();
        expect(screen.getByText(/No password set/)).toBeInTheDocument();
    });

    it('renders "Change Password" button when password exists', () => {
        render(<PasswordSection hasPassword={true} />);
        expect(screen.getByText('Change Password')).toBeInTheDocument();
        expect(screen.getByText(/Password is set/)).toBeInTheDocument();
    });

    it('opens set password dialog with correct fields', async () => {
        const user = userEvent.setup();
        render(<PasswordSection hasPassword={false} />);

        await user.click(screen.getByText('Set Password'));

        await waitFor(() => {
            expect(screen.getByText('Create a password to also log in with your email address.')).toBeInTheDocument();
        });

        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('opens change password dialog with correct fields', async () => {
        const user = userEvent.setup();
        render(<PasswordSection hasPassword={true} />);

        await user.click(screen.getByText('Change Password'));

        await waitFor(() => {
            expect(screen.getByText('Enter your current password and choose a new one.')).toBeInTheDocument();
        });

        expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    });

    it('shows validation error for short password in set mode', async () => {
        const user = userEvent.setup();
        render(<PasswordSection hasPassword={false} />);

        await user.click(screen.getByText('Set Password'));

        await waitFor(() => {
            expect(screen.getByLabelText('Password')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText('Password'), 'short');
        await user.type(screen.getByLabelText('Confirm Password'), 'short');

        const submitButtons = screen.getAllByText('Set Password');
        const dialogSubmit = submitButtons[submitButtons.length - 1];
        await user.click(dialogSubmit);

        await waitFor(() => {
            expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
        });
    });

    it('shows validation error for mismatched passwords', async () => {
        const user = userEvent.setup();
        render(<PasswordSection hasPassword={false} />);

        await user.click(screen.getByText('Set Password'));

        await waitFor(() => {
            expect(screen.getByLabelText('Password')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText('Password'), 'password123');
        await user.type(screen.getByLabelText('Confirm Password'), 'different123');

        const submitButtons = screen.getAllByText('Set Password');
        const dialogSubmit = submitButtons[submitButtons.length - 1];
        await user.click(dialogSubmit);

        await waitFor(() => {
            expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        });
    });

    it('calls setPassword and onSuccess on valid submission', async () => {
        mockSetPassword.mockResolvedValue({ message: 'password set successfully' });
        const onSuccess = jest.fn();
        const user = userEvent.setup();
        render(<PasswordSection hasPassword={false} onSuccess={onSuccess} />);

        await user.click(screen.getByText('Set Password'));

        await waitFor(() => {
            expect(screen.getByLabelText('Password')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText('Password'), 'newpassword123');
        await user.type(screen.getByLabelText('Confirm Password'), 'newpassword123');

        const submitButtons = screen.getAllByText('Set Password');
        const dialogSubmit = submitButtons[submitButtons.length - 1];
        await user.click(dialogSubmit);

        await waitFor(() => {
            expect(mockSetPassword).toHaveBeenCalledWith('newpassword123');
            expect(onSuccess).toHaveBeenCalled();
        });
    });

    it('calls changePassword on valid submission', async () => {
        mockChangePassword.mockResolvedValue({ message: 'password changed successfully' });
        const user = userEvent.setup();
        render(<PasswordSection hasPassword={true} />);

        await user.click(screen.getByText('Change Password'));

        await waitFor(() => {
            expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText('Current Password'), 'oldpass123');
        await user.type(screen.getByLabelText('New Password'), 'newpass12345');
        await user.type(screen.getByLabelText('Confirm New Password'), 'newpass12345');

        const submitButtons = screen.getAllByText('Change Password');
        const dialogSubmit = submitButtons[submitButtons.length - 1];
        await user.click(dialogSubmit);

        await waitFor(() => {
            expect(mockChangePassword).toHaveBeenCalledWith('oldpass123', 'newpass12345');
        });
    });
});
