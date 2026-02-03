'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function HeroSection() {
  const { t } = useLanguage();

  return (
    <section className="relative bg-gradient-to-br from-[#FAF7F2] via-white to-[#F5F0E8] overflow-hidden luxury-pattern">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-[#C9A962]/10 to-transparent blur-2xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 rounded-full bg-gradient-to-br from-[#722F37]/10 to-transparent blur-2xl"></div>
        <div className="absolute bottom-40 left-1/4 w-36 h-36 rounded-full bg-gradient-to-br from-[#C9A962]/10 to-transparent blur-2xl"></div>
      </div>

      {/* Subtle Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-20 left-10 text-9xl text-[#722F37]">✦</div>
        <div className="absolute top-40 right-20 text-8xl text-[#C9A962]">✦</div>
        <div className="absolute bottom-20 left-1/4 text-7xl text-[#722F37]">✦</div>
        <div className="absolute bottom-40 right-1/3 text-6xl text-[#C9A962]">✦</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm border border-[#E8E2D9] rounded-full px-5 py-2.5 mb-8 shadow-sm">
            <span className="text-sm text-[#6B6B6B] tracking-wide">Amas, Gaya, Bihar</span>
            <span className="mx-3 w-px h-4 bg-[#E8E2D9]"></span>
            <span className="text-sm text-[#C9A962] font-medium tracking-wide">fashionpoints.co.in</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            <span className="hero-gradient">{t('hero.title')}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[#6B6B6B] mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            {t('hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/sarees"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#722F37] to-[#8B3D47] text-white font-medium rounded-full hover:shadow-xl hover:shadow-[#722F37]/25 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {t('hero.shopNow')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-[#722F37] text-[#722F37] font-medium rounded-full hover:bg-[#722F37] hover:text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t('contact.visitStore')}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>10+</div>
              <div className="text-xs md:text-sm text-[#6B6B6B] mt-1 tracking-wide">{t('hero.yearsExperience')}</div>
            </div>
            <div className="text-center p-4 border-x border-[#E8E2D9]">
              <div className="text-3xl md:text-4xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>5K+</div>
              <div className="text-xs md:text-sm text-[#6B6B6B] mt-1 tracking-wide">{t('hero.happyCustomers')}</div>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl md:text-4xl font-bold text-[#722F37]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>1000+</div>
              <div className="text-xs md:text-sm text-[#6B6B6B] mt-1 tracking-wide">{t('hero.qualityProducts')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
}
