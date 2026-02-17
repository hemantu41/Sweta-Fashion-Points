'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SellerAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSeller, setIsSeller] = useState<boolean | null>(null);
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkSellerStatus = async () => {
      if (!user) {
        setIsSeller(false);
        return;
      }

      try {
        // Check if user is a seller
        const response = await fetch(`/api/sellers/me?userId=${user.id}`);
        const data = await response.json();

        if (data.seller) {
          setIsSeller(true);
          setSellerStatus(data.seller.status);
        } else {
          setIsSeller(false);
        }
      } catch (error) {
        console.error('Error checking seller status:', error);
        setIsSeller(false);
      }
    };

    if (!isLoading) {
      checkSellerStatus();
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (!isLoading && isSeller !== null) {
      if (!user) {
        // Not logged in - redirect to login
        router.push('/login');
      } else if (!isSeller) {
        // Logged in but not a seller - redirect to home
        router.push('/?error=unauthorized');
      } else if (sellerStatus !== 'approved') {
        // Seller not approved - redirect to pending page
        router.push('/seller/pending');
      }
    }
  }, [user, isLoading, isSeller, sellerStatus, router]);

  // Show loading while checking auth
  if (isLoading || isSeller === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!user || !isSeller || sellerStatus !== 'approved') {
    return null;
  }

  // User is approved seller - show content
  return <>{children}</>;
}
