import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OAuthButtons from '../oauth-buttons';

const mockSignIn = jest.fn();

jest.mock('next-auth/react', () => ({
    signIn: (...args: unknown[]) => mockSignIn(...args),
}));

jest.mock('@icons-pack/react-simple-icons', () => ({
    SiGithub: () => <svg data-testid="icon-github" />,
    SiGoogle: () => <svg data-testid="icon-google" />,
}));

jest.mock('lucide-react', () => ({
    Linkedin: () => <svg data-testid="icon-linkedin" />,
}));

describe('OAuthButtons', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders GitHub, Google, and LinkedIn buttons', () => {
        render(<OAuthButtons />);
        expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
        expect(screen.getByText('Continue with Google')).toBeInTheDocument();
        expect(screen.getByText('Continue with LinkedIn')).toBeInTheDocument();
    });

    it('renders provider icons', () => {
        render(<OAuthButtons />);
        expect(screen.getByTestId('icon-github')).toBeInTheDocument();
        expect(screen.getByTestId('icon-google')).toBeInTheDocument();
        expect(screen.getByTestId('icon-linkedin')).toBeInTheDocument();
    });

    it('calls signIn with linkedin when LinkedIn button is clicked', async () => {
        const user = userEvent.setup();
        render(<OAuthButtons />);

        await user.click(screen.getByText('Continue with LinkedIn'));
        expect(mockSignIn).toHaveBeenCalledWith('linkedin', { redirectTo: '/' });
    });

    it('calls signIn with github when GitHub button is clicked', async () => {
        const user = userEvent.setup();
        render(<OAuthButtons />);

        await user.click(screen.getByText('Continue with GitHub'));
        expect(mockSignIn).toHaveBeenCalledWith('github', { redirectTo: '/' });
    });

    it('calls signIn with google when Google button is clicked', async () => {
        const user = userEvent.setup();
        render(<OAuthButtons />);

        await user.click(screen.getByText('Continue with Google'));
        expect(mockSignIn).toHaveBeenCalledWith('google', { redirectTo: '/' });
    });
});
