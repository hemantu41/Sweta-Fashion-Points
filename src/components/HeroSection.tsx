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
            <a
              href="https://wa.me/919608063673"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-[#25D366] text-white font-medium rounded-full hover:bg-[#20BA5A] hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('contact.whatsapp')}
            </a>
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
