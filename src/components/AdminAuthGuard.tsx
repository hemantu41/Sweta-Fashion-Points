'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, login } = useAuth();
  const router = useRouter();
  const verifyingRef = useRef(false);
  const [serverVerified, setServerVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      // Not logged in — redirect to login, preserving the intended admin path.
      const currentPath =
        typeof window !== 'undefined' ? window.location.pathname : '/admin/dashboard';
      router.replace(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (isAdmin) {
      // localStorage already says admin — no server round-trip needed.
      setServerVerified(true);
      return;
    }

    // localStorage says NOT admin, but this could be stale data.
    // Verify against the server before locking the user out.
    if (verifyingRef.current) return;
    verifyingRef.current = true;

    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.isLoggedIn && data.user?.isAdmin) {
          // Server confirms admin — update localStorage and allow through.
          login(data.user);
          setServerVerified(true);
        } else {
          // Server also says not admin — redirect to home.
          setServerVerified(false);
          router.push('/?error=unauthorized');
        }
      })
      .catch(() => {
        setServerVerified(false);
        router.push('/?error=unauthorized');
      })
      .finally(() => {
        verifyingRef.current = false;
      });
  }, [user, isLoading, isAdmin, router, login]);

  // Show spinner while AuthContext is loading or while verifying against server.
  if (isLoading || (user && !isAdmin && serverVerified === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="w-12 h-12 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show nothing while redirecting (not logged in, or confirmed non-admin).
  if (!user || (!isAdmin && serverVerified !== true)) {
    return null;
  }

  // User is admin (either from localStorage or server-verified) — show content.
  return <>{children}</>;
}
