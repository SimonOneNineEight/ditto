import React from 'react';
import { Button } from '@/components/ui/button';
import { SiGithub, SiGoogle } from '@icons-pack/react-simple-icons';
import { signIn } from 'next-auth/react';

const OAuthButtons = () => {
    return (
        <div className="flex flex-col gap-3">
            <Button
                variant="outline"
                size="full"
                hasIcon
                icon={
                    <SiGithub
                        style={{ width: '1.25rem', height: '1.25rem' }}
                    />
                }
                iconPosition="left-center"
                onClick={() => signIn('github', { redirectTo: '/' })}
            >
                Continue with GitHub
            </Button>

            <Button
                variant="outline"
                size="full"
                hasIcon
                icon={
                    <SiGoogle
                        style={{ width: '1.25rem', height: '1.25rem' }}
                    />
                }
                iconPosition="left-center"
                onClick={() => signIn('google', { redirectTo: '/' })}
            >
                Continue with Google
            </Button>
        </div>
    );
};

export default OAuthButtons;
