'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to main dashboard — NDR tab is handled via state
export default function NDRRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/dashboard'); }, [router]);
  return null;
}
