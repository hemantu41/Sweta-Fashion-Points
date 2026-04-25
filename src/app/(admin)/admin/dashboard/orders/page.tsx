'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to main dashboard — orders tab is handled via state
export default function OrdersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/dashboard'); }, [router]);
  return null;
}
