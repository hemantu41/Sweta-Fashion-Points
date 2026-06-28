'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalyticsPageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== 'function') return;
    const search = searchParams.toString();
    const url = pathname + (search ? `?${search}` : '');
    window.gtag('config', GA_ID, { page_path: url });
  }, [pathname, searchParams]);

  return null;
}
