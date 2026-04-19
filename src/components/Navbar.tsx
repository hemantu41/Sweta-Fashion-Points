'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import LanguageSwitcher from './LanguageSwitcher';
import MegaMenu from './MegaMenu';
import { useCategories } from '@/hooks/useCategories';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  const { user, logout, isAuthenticated, isAdmin, isApprovedSeller, isSeller, sellerStatus, isActiveDeliveryPartner, deliveryPartnerId } = useAuth();
  const { totalItems } = useCart();
  const { tree: navTree } = useCategories();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userMenuItems = [
    { href: '/profile', label: 'Profile Details', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { href: '/orders', label: 'Order Details', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )},
    { href: '/payment-methods', label: 'Payment Method', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
    { href: '/addresses', label: 'Address', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )},
  ];

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/categories/search?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        const cats = (data.data || []).slice(0, 7);
        setSuggestions(cats);
        setShowDropdown(cats.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-2xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>Insta Fashion Points</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full" ref={searchContainerRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                onKeyDown={(e) => { if (e.key === 'Escape') setShowDropdown(false); }}
                placeholder="Search for products..."
                className="w-full px-4 py-2.5 pl-11 pr-4 bg-[#F5F0E8] border border-[#E8E2D9] rounded-full text-sm text-[#2D2D2D] placeholder-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {/* Category Autocomplete Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-[#E8E2D9] z-[60] overflow-hidden">
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest uppercase text-[#6B6B6B]">
                    Categories
                  </p>
                  {suggestions.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      onClick={() => { setShowDropdown(false); setSearchQuery(''); setSuggestions([]); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F0E8] transition-colors border-b border-[#F0EDE8] last:border-b-0"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#F0EDE8] flex-shrink-0 flex items-center justify-center">
                        <span className="text-lg">{cat.icon || '🛍️'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2D2D2D]">{cat.name}</p>
                        {cat.breadcrumb && cat.breadcrumb !== cat.name && (
                          <p className="text-xs text-[#6B6B6B]">{cat.breadcrumb}</p>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-[#C49A3C] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </form>

          {/* Desktop Navigation — Mega Menu */}
          <div className="hidden lg:block relative">
            <MegaMenu />
          </div>

          {/* Right side - Language, Cart & User Menu */}
          <div className="hidden lg:flex items-center space-x-4">
            <LanguageSwitcher />

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full text-[#2D2D2D] hover:text-[#722F37] hover:bg-[#F5F0E8] transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#722F37] text-white rounded-full text-xs flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* User Menu - Desktop */}
            {!isAuthenticated && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 hover:bg-[#F5F0E8] p-2.5 rounded-full transition-all duration-300"
                  title="Sign in"
                >
                  <svg className="w-6 h-6 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#E8E2D9] py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#E8E2D9] mb-1">
                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#6B6B6B]">My Account</p>
                    </div>
                    <Link
                      href="/login"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-[#2D2D2D] hover:bg-[#F5F0E8] transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-sm font-medium">Sign In</span>
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-[#2D2D2D] hover:bg-[#F5F0E8] transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span className="text-sm font-medium">Create Account</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 bg-[#F5F0E8] hover:bg-[#E8E2D9] px-4 py-2.5 rounded-full transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-[#722F37] rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <svg className={`w-4 h-4 text-[#6B6B6B] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-[#E8E2D9] py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-[#E8E2D9]">
                      <p className="font-medium text-[#2D2D2D]">{user?.name}</p>
                      <p className="text-sm text-[#6B6B6B]">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-[#2D2D2D] hover:bg-[#F5F0E8] transition-colors"
                        >
                          <span className="text-[#6B6B6B]">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      ))}

                      {/* Seller links */}
                      {isSeller && (
                        <div className="border-t border-[#E8E2D9] pt-2 mt-2">
                          {isApprovedSeller ? (
                            <Link
                              href="/seller/dashboard"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center space-x-3 px-4 py-2.5 text-[#2D2D2D] hover:bg-[#F5F0E8] transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span>Seller Dashboard</span>
                            </Link>
                          ) : (
                            <Link
                              href="/seller/pending"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center space-x-3 px-4 py-2.5 hover:bg-[#F5F0E8] transition-colors"
                            >
                              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div>
                                <span className="block text-sm text-orange-700 font-medium">Seller Account</span>
                                <span className="block text-xs text-orange-500 capitalize">{sellerStatus || 'pending'}</span>
                              </div>
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Delivery Partner Dashboard - Only for active delivery partners */}
                      {isActiveDeliveryPartner && deliveryPartnerId && (
                        <div className={`${!isApprovedSeller ? 'border-t border-[#E8E2D9] pt-2 mt-2' : ''}`}>
                          <Link
                            href={`/delivery/dashboard?partnerId=${deliveryPartnerId}`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2.5 text-[#2D2D2D] hover:bg-[#F5F0E8] transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                            <span>Delivery Partner Dashboard</span>
                          </Link>
                        </div>
                      )}

                      {/* Admin Portal Links - Only for admins */}
                      {isAdmin && (
                        <div className="border-t border-[#E8E2D9] pt-2 mt-2">
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2.5 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                            </svg>
                            <span>Admin Dashboard</span>
                          </Link>
                          <Link
                            href="/admin/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2.5 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            <span>Manage Orders & Delivery</span>
                          </Link>
                          <Link
                            href="/admin/products"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2.5 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <span>Manage Products</span>
                          </Link>
                          <Link
                            href="/admin/sellers"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2.5 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>Manage Sellers</span>
                          </Link>
                          <Link
                            href="/admin/delivery-partners"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-2.5 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                            </svg>
                            <span>Manage Delivery Partners</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-[#E8E2D9] pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-3">
            <LanguageSwitcher />

            {/* User Menu Button - Mobile */}
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-2 rounded-lg text-[#2D2D2D] hover:text-[#722F37] hover:bg-[#F5F0E8] transition-colors"
            >
              {isAuthenticated ? (
                <div className="w-8 h-8 bg-[#722F37] rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              ) : (
                <svg className="w-6 h-6 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </button>

            {/* Cart Icon - Mobile */}
            <Link
              href="/cart"
              className="relative p-2 rounded-lg text-[#2D2D2D] hover:text-[#722F37] hover:bg-[#F5F0E8] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#722F37] text-white rounded-full text-xs flex items-center justify-center font-bold">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-[#2D2D2D] hover:text-[#722F37] hover:bg-[#F5F0E8] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile User Menu — Logged Out */}
        {isUserMenuOpen && !isAuthenticated && (
          <div className="lg:hidden py-4 border-t border-[#E8E2D9]">
            <div className="px-4 py-2 mb-1">
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#6B6B6B]">My Account</p>
            </div>
            <Link
              href="/login"
              onClick={() => setIsUserMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-[#2D2D2D] hover:bg-[#F5F0E8] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Sign In</span>
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsUserMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 text-[#2D2D2D] hover:bg-[#F5F0E8] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#722F37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="font-medium">Create Account</span>
            </Link>
          </div>
        )}

        {/* Mobile User Menu — Logged In */}
        {isUserMenuOpen && isAuthenticated && (
          <div className="lg:hidden py-4 border-t border-[#E8E2D9]">
            {/* User Info */}
            <div className="px-4 py-3 bg-[#F5F0E8] rounded-lg mb-3">
              <p className="font-medium text-[#2D2D2D]">{user?.name}</p>
              <p className="text-sm text-[#6B6B6B]">{user?.email}</p>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              {userMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-[#2D2D2D] hover:bg-[#F5F0E8] rounded-lg transition-colors"
                >
                  <span className="text-[#6B6B6B]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Seller links - mobile */}
              {isSeller && (
                <div className="pt-2 mt-2 border-t border-[#E8E2D9]">
                  {isApprovedSeller ? (
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-[#2D2D2D] hover:bg-[#F5F0E8] rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>Seller Dashboard</span>
                    </Link>
                  ) : (
                    <Link
                      href="/seller/pending"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-[#F5F0E8] rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <span className="block text-sm text-orange-700 font-medium">Seller Account</span>
                        <span className="block text-xs text-orange-500 capitalize">{sellerStatus || 'pending'}</span>
                      </div>
                    </Link>
                  )}
                </div>
              )}

              {/* Admin Portal Links - Only for admins */}
              {isAdmin && (
                <div className="pt-2 mt-2 border-t border-[#E8E2D9]">
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                    </svg>
                    <span>Admin Dashboard</span>
                  </Link>
                  <Link
                    href="/admin/products"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>Manage Products</span>
                  </Link>
                  <Link
                    href="/admin/sellers"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Manage Sellers</span>
                  </Link>
                  <Link
                    href="/admin/delivery-partners"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <span>Manage Delivery Partners</span>
                  </Link>
                </div>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-lg transition-colors mt-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-6 border-t border-[#E8E2D9]">
            {/* Search Bar - Mobile */}
            <form onSubmit={handleSearch} className="mb-4 px-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') setShowDropdown(false); }}
                  placeholder="Search for products..."
                  className="w-full px-4 py-3 pl-11 pr-4 bg-[#F5F0E8] border border-[#E8E2D9] rounded-full text-sm text-[#2D2D2D] placeholder-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {/* Category Autocomplete Dropdown - Mobile */}
                {showDropdown && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-2xl border border-[#E8E2D9] z-[60] overflow-hidden">
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-widest uppercase text-[#6B6B6B]">
                      Categories
                    </p>
                    {suggestions.map(cat => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        onClick={() => { setShowDropdown(false); setSearchQuery(''); setSuggestions([]); setIsMenuOpen(false); }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F0E8] transition-colors border-b border-[#F0EDE8] last:border-b-0"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#F0EDE8] flex-shrink-0 flex items-center justify-center">
                          <span className="text-lg">{cat.icon || '🛍️'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2D2D2D]">{cat.name}</p>
                          {cat.breadcrumb && cat.breadcrumb !== cat.name && (
                            <p className="text-xs text-[#6B6B6B]">{cat.breadcrumb}</p>
                          )}
                        </div>
                        <svg className="w-4 h-4 text-[#C49A3C] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="flex flex-col space-y-1">
              {navTree.map((l1) => (
                <Link
                  key={l1.slug}
                  href={`/category/${l1.slug}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-base font-bold transition-colors text-[#2D2D2D] hover:text-[#722F37] hover:bg-[#F5F0E8]"
                >
                  {l1.icon && <span className="mr-2">{l1.icon}</span>}
                  {l1.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
