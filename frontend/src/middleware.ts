export { auth as middleware } from '@/auth';

export const config = {
    matcher: [
        // Protect all routes under (app)
        '/applications/:path*',
        '/interviews/:path*',
        '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
    ],
};
