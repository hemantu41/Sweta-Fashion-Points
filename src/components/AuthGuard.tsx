'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Routes that require login — keep in sync with src/middleware.ts PROTECTED array
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

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Prevent duplicate session-restore calls on rapid re-renders
  const restoringRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && isProtected(pathname)) {
      // Don't redirect to /login immediately — the iron-session cookie may still
      // be valid even though localStorage is empty (e.g. after a browser clear
      // or a transient network error during AuthContext's session-restore).
      // Try the session API first; only redirect if the server also says "no session".
      if (restoringRef.current) return;
      restoringRef.current = true;

      fetch('/api/auth/session')
        .then((r) => r.json())
        .then((data) => {
          if (data.isLoggedIn && data.user) {
            // Cookie is valid — restore user into AuthContext & localStorage.
            // This triggers a re-render; the next effect run will see
            // isAuthenticated = true and won't redirect.
            login(data.user);
          } else {
            // Truly unauthenticated — send to login with a return URL.
            router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
          }
        })
        .catch(() => {
          router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        })
        .finally(() => {
          restoringRef.current = false;
        });

    } else if (isAuthenticated && AUTH_ONLY_PATHS.includes(pathname)) {
      // Authenticated user landed on /login or /signup — redirect them away.
      // Use the callbackUrl from the query string if present; fall back to
      // /orders (NOT '/' — going to homepage would lose their intended destination).
      const params = new URLSearchParams(
        typeof window !== 'undefined' ? window.location.search : ''
      );
      const cb = params.get('callbackUrl') || '';
      const safe = cb.startsWith('/') && !cb.startsWith('//') ? cb : '/orders';
      router.replace(safe);
    }
  }, [isAuthenticated, isLoading, pathname, router, login]);

  // Show a full-screen spinner while auth is resolving on a protected route.
  if (isLoading && isProtected(pathname)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#FAF8F5' }}
      >
        <div className="w-10 h-10 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render nothing while the session-restore probe is in flight (prevents a
  // flash of protected content before auth is confirmed or denied).
  if (!isLoading && !isAuthenticated && isProtected(pathname)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#FAF8F5' }}
      >
        <div className="w-10 h-10 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
