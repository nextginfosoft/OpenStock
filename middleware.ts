import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = new Set(['/', '/about', '/help', '/terms', '/api-docs']);

export async function middleware(request: NextRequest) {
    // The marketing site is public
    if (PUBLIC_PATHS.has(request.nextUrl.pathname)) return NextResponse.next();

    const sessionCookie = getSessionCookie(request);

    // Check cookie presence - prevents obviously unauthorized users
    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Metadata files (favicon, share images) must stay public: browsers and link-preview crawlers have no session
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|twitter-image|robots.txt|sitemap.xml|sign-in|sign-up|forgot-password|reset-password|assets).*)',
    ],
};
