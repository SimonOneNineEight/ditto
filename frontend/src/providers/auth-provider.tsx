import React from 'react';
import { SessionProvider } from 'next-auth/react';

type Props = {
    children: React.ReactNode;
};

const AuthProvider = ({ children }: Props) => {
    return (
        <SessionProvider refetchOnWindowFocus={true} refetchInterval={240}>
            {children}
        </SessionProvider>
    );
};

export default AuthProvider;
