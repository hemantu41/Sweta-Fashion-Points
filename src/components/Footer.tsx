'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface Category {
  id: string;
  name: string;
  name_hindi: string | null;
  slug: string;
  is_active: boolean;
  product_count: number;
}

export default function Footer() {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories?level=1&active=true')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.success && Array.isArray(res.data)) {
          setCategories(res.data.filter((c: Category) => c.is_active));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer style={{ background: 'linear-gradient(180deg, #1F0E17 0%, #160A12 100%)' }}>
      {/* Top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#C49A3C] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Brand ── */}
          <div>
            <p className="text-[#C49A3C] text-sm font-medium mb-2 tracking-wide">
              Premium Fashion at Affordable Prices
            </p>
            <p className="text-[rgba(255,255,255,0.45)] text-xs leading-relaxed mb-6">
              {language === 'hi'
                ? 'भारत भर में उच्च गुणवत्ता के फैशन उत्पाद सुलभ कीमतों पर।'
                : 'High-quality fashion delivered across India at prices everyone can afford.'}
            </p>

            {/* Social icons */}
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ background: 'rgba(196,154,60,0.1)', border: '1px solid rgba(196,154,60,0.2)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#C49A3C'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(196,154,60,0.1)'; }}
              >
                <svg className="w-4 h-4 text-[#C49A3C]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
                style={{ background: 'rgba(196,154,60,0.1)', border: '1px solid rgba(196,154,60,0.2)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#C49A3C'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(196,154,60,0.1)'; }}
              >
                <svg className="w-4 h-4 text-[#C49A3C]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* ── Quick Links ── */}
          <div>
            <h3
              className="text-sm font-bold uppercase tracking-widest text-[#C49A3C] mb-5"
            >
              {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-3">
              {[
                { label: language === 'hi' ? 'होम' : 'Home', href: '/' },
                { label: language === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions', href: '/terms-and-conditions' },
                { label: language === 'hi' ? 'रिटर्न पॉलिसी' : 'Return Policy', href: '/return-policy' },
              ].map(item => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-2 text-[rgba(255,255,255,0.5)] hover:text-white transition-colors duration-200 text-sm"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#C49A3C] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/seller"
                  className="group flex items-center gap-2 text-[#C49A3C] hover:text-white transition-colors duration-200 text-sm font-medium"
                >
                  <span className="w-1 h-1 rounded-full bg-[#C49A3C] flex-shrink-0" />
                  {language === 'hi' ? 'विक्रेता बनें' : 'Become a Seller'}
                  <span className="text-xs"></span>
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Categories (live from DB) ── */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#C49A3C] mb-5">
              {t('footer.categories')}
            </h3>
            <ul className="space-y-3">
              {categories.length > 0 ? (
                categories.slice(0, 7).map(cat => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="group flex items-center gap-2 text-[rgba(255,255,255,0.5)] hover:text-white transition-colors duration-200 text-sm"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#C49A3C] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      {language === 'hi' && cat.name_hindi ? cat.name_hindi : cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                /* Skeleton while loading */
                [1,2,3,4].map(i => (
                  <li key={i} className="h-4 w-24 rounded bg-[rgba(255,255,255,0.06)] animate-pulse" />
                ))
              )}
            </ul>
          </div>

          {/* ── Contact Us ── */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#C49A3C] mb-5">
              {t('footer.contact')}
            </h3>
            <ul className="space-y-4">
              {/* Email */}
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(196,154,60,0.1)' }}>
                  <svg className="w-4 h-4 text-[#C49A3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <a
                  href="mailto:info@instafashionpoints.com"
                  className="text-[rgba(255,255,255,0.5)] hover:text-[#C49A3C] transition-colors text-sm"
                >
                  info@instafashionpoints.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-[rgba(196,154,60,0.25)] to-transparent mt-12 mb-8" />

        {/* ── Bottom Bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[rgba(255,255,255,0.3)] text-xs">
            © {new Date().getFullYear()} Insta Fashion Points. {t('footer.rights')}.
          </p>
          <a
            href="https://instafashionpoints.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C49A3C] text-xs tracking-widest font-medium hover:text-white transition-colors"
          >
            instafashionpoints.com
          </a>
        </div>
      </div>
    </footer>
  );
}
