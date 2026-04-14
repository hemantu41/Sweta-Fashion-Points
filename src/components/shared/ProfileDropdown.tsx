'use client';

import Link from 'next/link';
import { useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E8E0E4] rounded-xl shadow-xl z-[200] py-1"
    >
      {isAuthenticated ? (
        <>
          <div className="px-4 py-3 border-b border-[#f7f0f3]">
            <p className="text-sm font-semibold text-[#5B1A3A] truncate">{user?.name}</p>
            <p className="text-xs text-[#888] truncate mt-0.5">{user?.email || user?.mobile}</p>
          </div>

          <div className="py-1">
            <Link
              href="/orders"
              onClick={onClose}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#444] hover:bg-[#f7f0f3] hover:text-[#5B1A3A] transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Orders
            </Link>
            <Link
              href="/wishlist"
              onClick={onClose}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#444] hover:bg-[#f7f0f3] hover:text-[#5B1A3A] transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Wishlist
            </Link>
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#444] hover:bg-[#f7f0f3] hover:text-[#5B1A3A] transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
          </div>

          <div className="border-t border-[#f7f0f3] py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </>
      ) : (
        <div className="py-1">
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#444] hover:bg-[#f7f0f3] hover:text-[#5B1A3A] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            onClick={onClose}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#444] hover:bg-[#f7f0f3] hover:text-[#5B1A3A] transition-colors"
          >
            Create Account
          </Link>
        </div>
      )}
    </div>
  );
}
