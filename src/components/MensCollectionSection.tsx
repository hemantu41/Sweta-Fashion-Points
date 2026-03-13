'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface MensCategory {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  link: string;
  bgImage: string;
}

// All images: on-model editorial style, neutral backgrounds
const mensCategories: MensCategory[] = [
  {
    id: 'shirts',
    name: 'Shirts',
    nameHi: 'शर्ट',
    description: 'Modern formal and casual styles',
    descriptionHi: 'आधुनिक फॉर्मल और कैजुअल स्टाइल',
    link: '/mens?category=shirts',
    bgImage: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1067&fit=crop&crop=top&q=90',
  },
  {
    id: 'tshirts',
    name: 'T-Shirts',
    nameHi: 'टी-शर्ट',
    description: 'Comfortable everyday essentials',
    descriptionHi: 'आरामदायक रोजमर्रा की जरूरतें',
    link: '/mens?category=tshirts',
    bgImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1067&fit=crop&crop=top&q=90',
  },
  {
    id: 'jeans',
    name: 'Jeans',
    nameHi: 'जींस',
    description: 'Classic and premium denim fits',
    descriptionHi: 'क्लासिक और प्रीमियम डेनिम फिट',
    link: '/mens?category=jeans',
    bgImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=1067&fit=crop&crop=center&q=90',
  },
  {
    id: 'shorts',
    name: 'Shorts & Trousers',
    nameHi: 'शॉर्ट्स और ट्राउज़र',
    description: 'Relaxed and tailored options',
    descriptionHi: 'आरामदायक और सिले हुए विकल्प',
    link: '/mens?category=shorts',
    bgImage: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&h=1067&fit=crop&crop=center&q=90',
  },
];

// Shared CSS filter — harmonises all four images into one "signature look":
// slightly desaturated, lifted contrast, matched brightness
const PHOTO_FILTER = 'saturate(0.82) contrast(1.06) brightness(0.95)';

export default function MensCollectionSection() {
  const { language } = useLanguage();

  return (
    <section className="py-24 md:py-32 bg-[#FAFAFA]">
      <div className="max-w-[1300px] mx-auto px-6 sm:px-8 lg:px-14">

        {/* Section Header */}
        <div className="mb-16 md:mb-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <span className="block text-[10px] tracking-[0.38em] uppercase text-[#ADADAD] font-medium mb-4">
              {language === 'hi' ? 'पुरुष फैशन' : "Men's Fashion"}
            </span>
            <h2
              className="text-[2.2rem] sm:text-[2.8rem] md:text-[3.2rem] font-semibold text-[#1A1A1A] tracking-[-0.025em] leading-none"
              style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
            >
              {language === 'hi' ? 'पुरुषों का कलेक्शन' : "Men's Collection"}
            </h2>
            <p className="mt-3 text-[13px] text-[#ADADAD] font-light tracking-wide max-w-xs leading-relaxed">
              {language === 'hi'
                ? 'आधुनिक जरूरी वस्तुओं के साथ अपनी अलमारी को ऊंचा करें।'
                : 'Elevate your everyday wardrobe with modern essentials.'
              }
            </p>
          </div>

          {/* "View All" — desktop, far right, minimal arrow */}
          <Link
            href="/mens"
            className="hidden sm:inline-flex items-center gap-2.5 text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A] font-semibold border-b border-[#C8C8C8] pb-0.5 hover:border-[#722F37] hover:text-[#722F37] transition-colors duration-250 self-end mb-1 whitespace-nowrap group"
          >
            {language === 'hi' ? 'सभी देखें' : 'View All'}
            <svg className="w-2.5 h-2.5 stroke-1 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Category Grid — wide gutters, no card containers */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14 md:gap-x-10 lg:gap-x-12">
          {mensCategories.map((category) => (
            <Link
              key={category.id}
              href={category.link}
              className="group block"
            >
              {/* Image — sharp rectangle, consistent CSS filter, ghost-button hover */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[#EDEBE8]">

                {/* Photo with shared filter for visual consistency */}
                <div
                  className="absolute inset-0 bg-cover bg-top transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  style={{
                    backgroundImage: `url(${category.bgImage})`,
                    filter: PHOTO_FILTER,
                  }}
                />

                {/* Hover: subtle dark overlay so ghost button reads clearly */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/28 transition-colors duration-400" />

                {/* Ghost button — transparent, thin 1px white border, fades in centered */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-350">
                  <span className="border border-white/85 text-white text-[9.5px] font-semibold tracking-[0.26em] uppercase px-6 py-3 backdrop-blur-[2px]">
                    {language === 'hi' ? 'अभी खरीदें' : 'Shop Now'}
                  </span>
                </div>
              </div>

              {/* Text — left-flush with image, all-caps title, wide tracking */}
              <div className="mt-4">
                <h3
                  className="text-[11px] sm:text-[11.5px] font-semibold text-[#1A1A1A] tracking-[0.22em] uppercase leading-snug group-hover:text-[#722F37] transition-colors duration-250"
                >
                  {language === 'hi' ? category.nameHi : category.name}
                </h3>
                <p className="mt-1.5 text-[11px] text-[#B8B8B8] font-light leading-snug tracking-wide">
                  {language === 'hi' ? category.descriptionHi : category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile: bottom CTA — sharp rectangle */}
        <div className="mt-14 sm:hidden text-center">
          <Link
            href="/mens"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 border border-[#1A1A1A] text-[#1A1A1A] text-[10px] font-semibold tracking-[0.22em] uppercase hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 group"
          >
            {language === 'hi' ? 'पूरा कलेक्शन देखें' : 'View Full Collection'}
            <svg className="w-2.5 h-2.5 stroke-1 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
