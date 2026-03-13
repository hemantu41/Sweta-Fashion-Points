'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  const { user, logout, isAuthenticated, isAdmin, isApprovedSeller, isSeller, sellerStatus, isActiveDeliveryPartner, deliveryPartnerId } = useAuth();
  const { totalItems } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { href: '/mens', label: t('nav.mens') },
    { href: '/womens', label: t('nav.womens') },
    { href: '/sarees', label: t('nav.sarees') },
    { href: '/kids', label: t('nav.kids') },
    { href: '/footwear', label: t('nav.footwear') },
    { href: '/makeup', label: t('nav.makeup') },
  ];

  const userMenuItems = [
    { href: '/profile', label: 'Profile Details', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { href: '/orders', label: 'My Orders', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { href: '/payment-methods', label: 'Payment Method', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
    { href: '/addresses', label: 'Saved Addresses', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-[#E8E2D9]" style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* Main row: Logo | Nav Links | Search + Icons */}
        <div className="flex items-center justify-between h-[72px] gap-6">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span
              className="text-[1.75rem] font-semibold tracking-tight text-[#722F37] leading-none"
              style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
            >
              Fashion Points
            </span>
          </Link>

          {/* Desktop Nav Links — center */}
          <div className="hidden lg:flex items-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-5 py-1 text-[11px] font-medium tracking-[0.14em] uppercase text-[#2D2D2D] hover:text-[#722F37] border-b-2 border-transparent hover:border-[#722F37] transition-all duration-200 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right — Search, Wishlist, Cart, User */}
          <div className="hidden lg:flex items-center gap-3">

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-[320px] px-4 py-2 pl-10 pr-4 bg-[#F5F5F5] border border-transparent rounded-full text-[13px] text-[#2D2D2D] placeholder-[#9E9E9E] focus:outline-none focus:bg-white focus:border-[#E8E2D9] focus:ring-1 focus:ring-[#722F37]/20 transition-all duration-200"
                />
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9E9E9E]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            <LanguageSwitcher />

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="p-2 text-[#5C5C5C] hover:text-[#722F37] transition-colors duration-200"
              aria-label="Wishlist"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-[#5C5C5C] hover:text-[#722F37] transition-colors duration-200"
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#722F37] text-white rounded-full text-[10px] flex items-center justify-center font-semibold leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-[#F5F0E8] transition-colors duration-200"
                >
                  <div className="w-7 h-7 bg-[#722F37] rounded-full flex items-center justify-center text-white font-medium text-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-[12px] text-[#2D2D2D] font-medium max-w-[80px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <svg className={`w-3 h-3 text-[#9E9E9E] transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1 w-60 bg-white border border-[#E8E2D9] shadow-xl py-1 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-[#E8E2D9]">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{user?.name}</p>
                      <p className="text-xs text-[#9E9E9E] mt-0.5">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#3D3D3D] hover:bg-[#F5F0E8] hover:text-[#722F37] transition-colors"
                        >
                          <span className="text-[#9E9E9E]">{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}

                      {/* Seller links */}
                      {isSeller && (
                        <div className="border-t border-[#E8E2D9] mt-1 pt-1">
                          {isApprovedSeller ? (
                            <Link
                              href="/seller/dashboard"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#3D3D3D] hover:bg-[#F5F0E8] hover:text-[#722F37] transition-colors"
                            >
                              <svg className="w-4 h-4 text-[#9E9E9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Seller Dashboard
                            </Link>
                          ) : (
                            <Link
                              href="/seller/pending"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FFF8F0] transition-colors"
                            >
                              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div>
                                <span className="block text-[13px] text-orange-700 font-medium">Seller Account</span>
                                <span className="block text-[11px] text-orange-400 capitalize">{sellerStatus || 'pending'}</span>
                              </div>
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Delivery Partner */}
                      {isActiveDeliveryPartner && deliveryPartnerId && (
                        <div className={`${!isApprovedSeller ? 'border-t border-[#E8E2D9] mt-1 pt-1' : ''}`}>
                          <Link
                            href={`/delivery/dashboard?partnerId=${deliveryPartnerId}`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#3D3D3D] hover:bg-[#F5F0E8] hover:text-[#722F37] transition-colors"
                          >
                            <svg className="w-4 h-4 text-[#9E9E9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                            Delivery Dashboard
                          </Link>
                        </div>
                      )}

                      {/* Admin Links */}
                      {isAdmin && (
                        <div className="border-t border-[#E8E2D9] mt-1 pt-1">
                          {[
                            { href: '/admin/orders', label: 'Manage Orders' },
                            { href: '/admin/products', label: 'Manage Products' },
                            { href: '/admin/sellers', label: 'Manage Sellers' },
                            { href: '/admin/delivery-partners', label: 'Delivery Partners' },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#722F37] hover:bg-[#F5F0E8] transition-colors font-medium"
                            >
                              <span className="w-1 h-1 rounded-full bg-[#722F37] flex-shrink-0" />
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-[#E8E2D9] mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 w-full transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-[12px] font-medium tracking-wide text-[#2D2D2D] hover:text-[#722F37] transition-colors duration-200"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile right */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageSwitcher />

            {isAuthenticated && (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-1"
              >
                <div className="w-7 h-7 bg-[#722F37] rounded-full flex items-center justify-center text-white font-medium text-xs">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>
            )}

            <Link href="/cart" className="relative p-2 text-[#2D2D2D]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#722F37] text-white rounded-full text-[10px] flex items-center justify-center font-semibold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-[#2D2D2D]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile User Menu */}
        {isUserMenuOpen && isAuthenticated && (
          <div className="lg:hidden py-3 border-t border-[#E8E2D9]">
            <div className="px-4 py-2.5 bg-[#F5F0E8] mb-2">
              <p className="text-sm font-semibold text-[#1A1A1A]">{user?.name}</p>
              <p className="text-xs text-[#9E9E9E] mt-0.5">{user?.email}</p>
            </div>

            <div className="space-y-0.5">
              {userMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-[#3D3D3D] hover:bg-[#F5F0E8] transition-colors"
                >
                  <span className="text-[#9E9E9E]">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {isSeller && (
                <div className="border-t border-[#E8E2D9] pt-1 mt-1">
                  {isApprovedSeller ? (
                    <Link href="/seller/dashboard" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-[#3D3D3D] hover:bg-[#F5F0E8] transition-colors">
                      <svg className="w-4 h-4 text-[#9E9E9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Seller Dashboard
                    </Link>
                  ) : (
                    <Link href="/seller/pending" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[#FFF8F0] transition-colors">
                      <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <span className="block text-sm text-orange-700 font-medium">Seller Account</span>
                        <span className="block text-xs text-orange-400 capitalize">{sellerStatus || 'pending'}</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="border-t border-[#E8E2D9] pt-1 mt-1">
                  {[
                    { href: '/admin/products', label: 'Manage Products' },
                    { href: '/admin/sellers', label: 'Manage Sellers' },
                    { href: '/admin/delivery-partners', label: 'Delivery Partners' },
                  ].map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-[#722F37] font-medium hover:bg-[#F5F0E8] transition-colors">
                      <span className="w-1 h-1 rounded-full bg-[#722F37]" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full transition-colors border-t border-[#E8E2D9] mt-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-[#E8E2D9]">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2.5 pl-10 bg-[#F5F5F5] rounded-full text-sm text-[#2D2D2D] placeholder-[#9E9E9E] focus:outline-none focus:ring-1 focus:ring-[#722F37]/30 transition-all"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9E9E9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            <div className="flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-1 py-3 text-sm font-medium tracking-[0.1em] uppercase text-[#2D2D2D] hover:text-[#722F37] border-b border-[#F0EDE8] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
