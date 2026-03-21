import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';

const PROTECTED = ['/account', '/orders', '/checkout'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isLoginPage = pathname === '/login';

  // Only run on protected routes and login page
  if (!isProtected && !isLoginPage) return NextResponse.next();

  // Read and decrypt the session cookie
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

  // Not logged in → redirect to /login with callbackUrl
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → skip /login
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/orders/:path*', '/checkout/:path*', '/login'],
};
