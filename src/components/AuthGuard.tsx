'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Routes that require login
const PROTECTED_PREFIXES = [
  '/cart',
  '/checkout',
  '/orders',
  '/profile',
  '/wishlist',
  '/addresses',
  '/payment-methods',
  '/payment',
  '/account',
];

// Routes that logged-in users should not see
const AUTH_ONLY_PATHS = ['/login', '/signup'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );
}

function Spinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#FAF8F5' }}
    >
      <div className="w-10 h-10 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const checkingRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && isProtected(pathname)) {
      // AuthContext already tried session-restore. As a final fallback, call
      // /api/auth/session (Node.js, reliable) before redirecting to login.
      if (checkingRef.current) return;
      checkingRef.current = true;

      fetch('/api/auth/session')
        .then((r) => r.json())
        .then((data) => {
          if (data.isLoggedIn && data.user) {
            // Cookie valid — hydrate state without touching the URL.
            login(data.user);
          } else {
            router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
          }
        })
        .catch(() => {
          router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        })
        .finally(() => {
          checkingRef.current = false;
        });

    } else if (isAuthenticated && AUTH_ONLY_PATHS.includes(pathname)) {
      // User is authenticated but landed on /login or /signup.
      // Redirect them away. We no longer verify the cookie here because:
      //   (a) the middleware no longer redirects protected routes, so there
      //       is no redirect loop to break, and
      //   (b) calling logout() if the cookie isn't immediately readable on
      //       mobile was wiping localStorage right after login.
      const params = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : ''
      );
      const cb = params.get('callbackUrl') || '';
      const safe =
        cb && cb.startsWith('/') && !cb.startsWith('//')
          ? cb
          : '/';
      router.replace(safe);
    }
  }, [isAuthenticated, isLoading, pathname, router, login]);

  // Spinner while AuthContext is resolving (session-restore in flight).
  if (isLoading && isProtected(pathname)) {
    return <Spinner />;
  }

  // Spinner while the /api/auth/session fallback check is in flight.
  if (!isLoading && !isAuthenticated && isProtected(pathname)) {
    return <Spinner />;
  }

  return <>{children}</>;
}
