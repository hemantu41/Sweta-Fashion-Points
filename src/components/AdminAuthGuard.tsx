'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in - redirect to login
        router.push('/login');
      } else if (!isAdmin) {
        // Logged in but not admin - redirect to home with error
        router.push('/?error=unauthorized');
      }
    }
  }, [user, isLoading, isAdmin, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user || !isAdmin) {
    return null;
  }

  // User is admin - show content
  return <>{children}</>;
}
