import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

/**
 * Middleware is intentionally minimal.
 *
 * We do NOT redirect unauthenticated requests to protected routes here.
 * Reason: the Edge Runtime's unsealData() has subtle behaviour differences
 * from the Node.js getSession() used in API routes.  When the two disagree
 * (e.g. due to env-var timing or runtime differences on Vercel), the
 * middleware keeps redirecting to /login while the API routes say "logged in",
 * producing an infinite redirect loop that is impossible to break client-side.
 *
 * Protection for /orders, /profile, /addresses, /payment-methods, etc. is
 * handled entirely by AuthGuard (client-side) which calls /api/auth/session
 * (Node.js runtime) as the single source of truth.
 *
 * The only thing the middleware does here is redirect already-authenticated
 * users AWAY from the /login page so they don't see it when they're logged in.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only act on the login page — everything else passes straight through.
  if (pathname !== '/login') return NextResponse.next();

  // Try to read the iron-session cookie.
  let isLoggedIn = false;
  const raw = request.cookies.get(sessionOptions.cookieName)?.value;
  if (raw) {
    try {
      const data = await unsealData<SessionData>(raw, {
        password: sessionOptions.password as string,
      });
      isLoggedIn = data.isLoggedIn ?? false;
    } catch {
      isLoggedIn = false;
    }
  }

  // Already logged in → redirect away from /login.
  if (isLoggedIn) {
    const callbackRaw = request.nextUrl.searchParams.get('callbackUrl') || '';
    // Security: same-origin paths only; '/' is excluded (not useful post-login).
    const safe =
      callbackRaw &&
      callbackRaw.startsWith('/') &&
      !callbackRaw.startsWith('//') &&
      callbackRaw !== '/'
        ? callbackRaw
        : '/orders';
    return NextResponse.redirect(new URL(safe, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Only intercept /login — protected routes are handled by AuthGuard.
  matcher: ['/login'],
};
