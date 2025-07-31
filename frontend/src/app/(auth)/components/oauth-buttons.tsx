import React from 'react';
import { Button } from '@/components/ui/button';
import { SiGithub, SiGoogle } from '@icons-pack/react-simple-icons';
import { signIn } from 'next-auth/react';

const OAuthButtons = () => {
    return (
        <section className="flex flex-col gap-4 my-4">
            <Button
                variant="outline"
                size="full"
                hasIcon
                icon={
                    <SiGoogle style={{ width: '1.25rem', height: '1.25rem' }} />
                }
                iconPosition="left-center"
                onClick={() => signIn('google', { redirectTo: '/' })}
            >
                Log in with Google
            </Button>

            <Button
                variant="outline"
                size="full"
                hasIcon
                icon={
                    <SiGithub style={{ width: '1.25rem', height: '1.25rem' }} />
                }
                iconPosition="left-center"
                onClick={() => signIn('github', { redirectTo: '/' })}
            >
                Log in with Github
            </Button>
        </section>
    );
};

export default OAuthButtons;
