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

// All images: on-model editorial style, neutral/white backgrounds — consistent visual language
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

export default function MensCollectionSection() {
  const { language } = useLanguage();

  return (
    <section className="py-20 md:py-28 bg-[#FAFAFA]">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* Section Header — editorial, left-aligned on desktop */}
        <div className="mb-12 md:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="block text-[10px] tracking-[0.36em] uppercase text-[#9E9E9E] font-medium mb-3">
              {language === 'hi' ? 'पुरुष फैशन' : "Men's Fashion"}
            </span>
            <h2
              className="text-[2.2rem] sm:text-[2.8rem] md:text-[3.2rem] font-semibold text-[#1A1A1A] tracking-[-0.025em] leading-none"
              style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
            >
              {language === 'hi' ? 'पुरुषों का कलेक्शन' : "Men's Collection"}
            </h2>
            <p className="mt-3 text-[13.5px] text-[#6B6B6B] font-light tracking-wide max-w-xs leading-relaxed">
              {language === 'hi'
                ? 'आधुनिक जरूरी वस्तुओं के साथ अपनी अलमारी को ऊंचा करें।'
                : 'Elevate your everyday wardrobe with modern essentials.'
              }
            </p>
          </div>

          {/* Desktop: "View All" link top-right */}
          <Link
            href="/mens"
            className="hidden sm:inline-flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase text-[#1A1A1A] font-semibold border-b border-[#1A1A1A] pb-0.5 hover:text-[#722F37] hover:border-[#722F37] transition-colors duration-200 self-end mb-1 whitespace-nowrap group"
          >
            {language === 'hi' ? 'सभी देखें' : 'View All'}
            <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Category Grid — no card containers, images on page bg directly */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10 md:gap-x-7">
          {mensCategories.map((category) => (
            <Link
              key={category.id}
              href={category.link}
              className="group block"
            >
              {/* Image — sharp rectangle, no rounded corners, no card wrapper */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[#EDEBE8]">
                {/* Photo */}
                <div
                  className="absolute inset-0 bg-cover bg-top transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  style={{ backgroundImage: `url(${category.bgImage})` }}
                />

                {/* "Shop Now" — dark bar slides up from bottom on hover */}
                <div className="absolute inset-x-0 bottom-0 bg-[#1A1A1A] py-3.5 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-350 ease-out">
                  <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-white">
                    {language === 'hi' ? 'अभी खरीदें' : 'Shop Now'}
                  </span>
                </div>
              </div>

              {/* Text — left-flush directly on page background */}
              <div className="mt-4">
                <h3
                  className="text-[1rem] font-semibold text-[#1A1A1A] tracking-tight leading-snug group-hover:text-[#722F37] transition-colors duration-250"
                  style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
                >
                  {language === 'hi' ? category.nameHi : category.name}
                </h3>
                <p className="mt-1 text-[12.5px] text-[#8A8A8A] font-light leading-snug tracking-wide">
                  {language === 'hi' ? category.descriptionHi : category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile: Bottom CTA — rectangular, no rounded corners */}
        <div className="mt-12 sm:hidden text-center">
          <Link
            href="/mens"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 border border-[#1A1A1A] text-[#1A1A1A] text-[10px] font-semibold tracking-[0.22em] uppercase hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 group"
          >
            {language === 'hi' ? "पूरा कलेक्शन देखें" : "View Full Collection"}
            <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
