'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const DISMISS_KEY = 'pincodeBannerDismissed';

export default function PincodeBanner() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  // Don't show if: auth still loading, user not logged in, location already set, or dismissed
  const hasLocation = !!(user?.latitude && user?.longitude);
  if (isLoading || !isAuthenticated || hasLocation || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-[#FFF8F0] border border-[#E8C99A] rounded-xl px-4 py-3 mb-4 text-sm">
      <div className="flex items-center gap-2 text-[#2D2D2D]">
        <svg className="w-4 h-4 text-[#722F37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>
          Enable your location to discover products from sellers near you.{' '}
          <Link href="/profile" className="text-[#722F37] font-semibold hover:underline">
            Set in Profile →
          </Link>
        </span>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 text-[#6B6B6B] hover:text-[#2D2D2D] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
