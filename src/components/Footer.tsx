'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-5">
              <span className="text-2xl font-bold text-[#C9A962]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>Sweta</span>
              <span className="text-lg font-light text-gray-300 tracking-wide">Fashion Points</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#2D2D2D] flex items-center justify-center text-gray-400 hover:bg-[#722F37] hover:text-white transition-all duration-300"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#2D2D2D] flex items-center justify-center text-gray-400 hover:bg-[#722F37] hover:text-white transition-all duration-300"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-[#C9A962]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>{t('footer.quickLinks')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide">
                  {t('nav.newArrivals')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide">
                  {t('nav.visitStore')}
                </Link>
              </li>
              <li>
                <Link href="/seller/register" className="text-[#C9A962] hover:text-white transition-colors text-sm tracking-wide font-medium flex items-center gap-2">
                  Become a Seller <span className="text-xs">✨</span>
                </Link>
              </li>
              <li>
                <Link href="/delivery-partner/register" className="text-[#C9A962] hover:text-white transition-colors text-sm tracking-wide font-medium flex items-center gap-2">
                  Become a Delivery Partner <span className="text-xs">🚚</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-[#C9A962]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>{t('footer.categories')}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/mens" className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide">
                  {t('nav.mens')}
                </Link>
              </li>
              <li>
                <Link href="/womens" className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide">
                  {t('nav.womens')}
                </Link>
              </li>
              <li>
                <Link href="/sarees" className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide flex items-center gap-2">
                  {t('nav.sarees')} <span className="text-[#C9A962]">✦</span>
                </Link>
              </li>
              <li>
                <Link href="/kids" className="text-gray-400 hover:text-white transition-colors text-sm tracking-wide">
                  {t('nav.kids')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-5 text-[#C9A962]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>{t('footer.contact')}</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-[#C9A962] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-400 text-sm">
                  Amas, Gaya, Bihar - 824219
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#C9A962] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+919608063673" className="text-gray-400 hover:text-white transition-colors text-sm">
                  +91 96080 63673
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-[#C9A962] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-400 text-sm">
                  {t('contact.hoursValue')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#2D2D2D] mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Sweta Fashion Points. {t('footer.rights')}.
            </p>
            <p className="text-[#C9A962] text-sm tracking-wider">
              fashionpoints.co.in
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
