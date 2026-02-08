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
  const { t } = useLanguage();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
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
    { href: '/', label: t('nav.home') },
    { href: '/mens', label: t('nav.mens') },
    { href: '/womens', label: t('nav.womens') },
    { href: '/sarees', label: t('nav.sarees'), highlight: true },
    { href: '/kids', label: t('nav.kids') },
    { href: '/new-arrivals', label: t('nav.newArrivals') },
    { href: '/contact', label: t('nav.visitStore') },
  ];

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

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>Sweta</span>
            <span className="text-lg font-light text-[#6B6B6B] tracking-wide">Fashion Points</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                  link.highlight
                    ? 'bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white rounded-full hover:shadow-lg hover:shadow-[#722F37]/20'
                    : 'text-[#2D2D2D] hover:text-[#722F37] elegant-underline'
                }`}
              >
                {link.label}
                {link.highlight && <span className="ml-1 text-[#C9A962]">✦</span>}
              </Link>
            ))}
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

                      {/* Admin Portal Link - Only for admins */}
                      {isAdmin && (
                        <Link
                          href="/admin/products"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-3 px-4 py-2.5 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] transition-colors border-t border-[#E8E2D9] mt-2 pt-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span>Admin Portal</span>
                        </Link>
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
            {isAuthenticated && (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 rounded-lg text-[#2D2D2D] hover:text-[#722F37] hover:bg-[#F5F0E8] transition-colors"
              >
                <div className="w-8 h-8 bg-[#722F37] rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>
            )}

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

        {/* Mobile User Menu */}
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

              {/* Admin Portal Link - Only for admins */}
              {isAdmin && (
                <Link
                  href="/admin/products"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-[#722F37] bg-[#F5F0E8] font-medium hover:bg-[#E8E2D9] rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Admin Portal</span>
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-lg transition-colors"
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
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    link.highlight
                      ? 'bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white'
                      : 'text-[#2D2D2D] hover:text-[#722F37] hover:bg-[#F5F0E8]'
                  }`}
                >
                  {link.label}
                  {link.highlight && <span className="ml-2 text-[#C9A962]">✦</span>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
