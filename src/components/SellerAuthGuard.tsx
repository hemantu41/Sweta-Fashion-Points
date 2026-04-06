'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Guards all /seller/dashboard/** routes.
 * Uses AuthContext values directly (populated from localStorage + background /api/auth/me refresh)
 * instead of making a redundant /api/sellers/me call on every render.
 */
export default function SellerAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isSeller, isApprovedSeller } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
    } else if (!isSeller) {
      router.push('/?error=unauthorized');
    } else if (!isApprovedSeller) {
      router.push('/seller/pending');
    }
  }, [user, isLoading, isSeller, isApprovedSeller, router]);

  // Show spinner while auth is still resolving
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render nothing while redirecting
  if (!user || !isSeller || !isApprovedSeller) {
    return null;
  }

  return <>{children}</>;
}
