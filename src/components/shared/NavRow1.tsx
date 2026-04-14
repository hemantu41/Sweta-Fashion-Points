'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import ProfileDropdown from './ProfileDropdown';

export default function NavRow1() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { totalItems } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const firstName = user?.name?.split(' ')[0] ?? '';
  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('')
    : '';

  return (
    <div className="w-full bg-white border-b border-[#E8E0E4]/50 h-[60px] px-8 flex items-center gap-4">
      {/* Logo */}
      <Link
        href="/"
        className="flex-shrink-0 text-[20px] text-[#5B1A3A] font-[family-name:var(--font-playfair)] font-semibold leading-none whitespace-nowrap"
      >
        Insta Fashion Points
      </Link>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="flex-1 max-w-[480px] hidden md:flex"
      >
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for products…"
            className="w-full h-[38px] pl-10 pr-4 bg-[#F5F5F5] border border-[#E8E0E4] rounded-[22px] text-sm text-[#333] placeholder-[#999] focus:outline-none focus:border-[#5B1A3A] transition-colors"
          />
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]"
            aria-label="Search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Language toggle */}
      <div className="flex items-center gap-0 bg-[#F5F5F5] border border-[#E8E0E4] rounded-[22px] overflow-hidden h-[32px] text-xs font-medium flex-shrink-0">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 h-full transition-colors ${
            language === 'en'
              ? 'bg-[#5B1A3A] text-white'
              : 'text-[#666] hover:text-[#5B1A3A]'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('hi')}
          className={`px-3 h-full transition-colors ${
            language === 'hi'
              ? 'bg-[#5B1A3A] text-white'
              : 'text-[#666] hover:text-[#5B1A3A]'
          }`}
        >
          हि
        </button>
      </div>

      {/* Cart icon */}
      <Link
        href="/cart"
        className="relative flex items-center justify-center w-[38px] h-[38px] rounded-full border border-[#E8E0E4] hover:border-[#5B1A3A] transition-colors flex-shrink-0"
        aria-label="Cart"
      >
        <svg className="w-[18px] h-[18px] text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {totalItems > 9 ? '9+' : totalItems}
          </span>
        )}
      </Link>

      {/* Profile pill */}
      <div ref={profileRef} className="relative flex-shrink-0">
        <button
          onClick={() => setProfileOpen(prev => !prev)}
          className="flex items-center gap-2 h-[38px] px-3 rounded-[22px] border border-[#E8E0E4] hover:border-[#5B1A3A] transition-colors bg-white"
          aria-label="Profile menu"
          aria-expanded={profileOpen}
        >
          {isAuthenticated ? (
            <>
              {/* Avatar with initials */}
              <span className="w-[28px] h-[28px] rounded-full bg-[#5B1A3A] text-white text-[11px] font-semibold flex items-center justify-center leading-none flex-shrink-0">
                {initials || 'U'}
              </span>
              <span className="text-sm text-[#333] font-medium max-w-[80px] truncate hidden sm:block">
                {firstName}
              </span>
            </>
          ) : (
            <span className="text-sm text-[#333] font-medium">Login</span>
          )}
          {/* Chevron down */}
          <svg
            className={`w-[10px] h-[10px] text-[#888] transition-transform ${profileOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <ProfileDropdown isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>

      {/* Mobile search icon (md and below) */}
      <button
        onClick={() => router.push('/search')}
        className="flex md:hidden items-center justify-center w-[38px] h-[38px] rounded-full border border-[#E8E0E4] hover:border-[#5B1A3A] transition-colors flex-shrink-0"
        aria-label="Search"
      >
        <svg className="w-[18px] h-[18px] text-[#444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  );
}
