'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const publicPaths = ['/login', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      const isPublicPath = publicPaths.includes(pathname);

      if (!isAuthenticated && !isPublicPath) {
        // Redirect to login if not authenticated and trying to access protected route
        router.push('/login');
      } else if (isAuthenticated && isPublicPath) {
        // Redirect to home if authenticated and trying to access login/signup
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-wine border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal font-lato">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content while redirecting
  const isPublicPath = publicPaths.includes(pathname);
  if (!isAuthenticated && !isPublicPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-wine border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal font-lato">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
