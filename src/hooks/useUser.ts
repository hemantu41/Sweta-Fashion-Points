'use client';

import { useState, useEffect } from 'react';

export type SessionUser = {
  mobile: string;
  isLoggedIn: boolean;
};

export function useUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setUser(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return {
    user,
    isLoading,
    isLoggedIn: user?.isLoggedIn ?? false,
  };
}

/**
 * Masks a mobile number — shows only the last 5 digits.
 * e.g. "9876543210" → "98765XXXXX"  →  actually last 5: "XXXXX43210"
 * Display format: "XXXXX" + last5
 */
export function maskMobile(mobile: string): string {
  if (!mobile || mobile.length < 5) return mobile;
  return 'XXXXX' + mobile.slice(-5);
}
