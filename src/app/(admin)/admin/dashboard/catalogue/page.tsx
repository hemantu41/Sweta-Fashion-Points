'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CatalogueRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/dashboard'); }, [router]);
  return null;
}
