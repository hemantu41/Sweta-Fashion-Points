'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Only these routes require login — everything else is public
const PROTECTED_PREFIXES = [
  '/cart',
  '/checkout',
  '/orders',
  '/profile',
  '/wishlist',
  '/addresses',
  '/payment',
];

// Routes that logged-in users should not see (redirect them home)
const AUTH_ONLY_PATHS = ['/login', '/signup'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && isProtected(pathname)) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    } else if (isAuthenticated && AUTH_ONLY_PATHS.includes(pathname)) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Only block rendering (show spinner) while redirecting away from a protected route
  if (isLoading && isProtected(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F5' }}>
        <div className="w-10 h-10 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoading && !isAuthenticated && isProtected(pathname)) {
    return null;
  }

  return <>{children}</>;
}
