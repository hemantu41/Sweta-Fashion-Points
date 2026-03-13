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
    <section className="py-20 md:py-28 bg-[#F8F6F3]">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* Section Header */}
        <div className="text-center mb-14 md:mb-18">
          <span className="inline-block text-[11px] tracking-[0.32em] uppercase text-[#722F37] font-semibold mb-4">
            {language === 'hi' ? 'पुरुष फैशन' : "Men's Fashion"}
          </span>
          <h2
            className="text-[2.4rem] sm:text-[3rem] md:text-[3.5rem] font-semibold text-[#1A1A1A] tracking-[-0.02em] leading-tight mb-5"
            style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
          >
            {language === 'hi' ? "पुरुषों का कलेक्शन" : "Men's Collection"}
          </h2>
          <p className="text-[15px] sm:text-base text-[#6B6B6B] font-light tracking-wide max-w-md mx-auto leading-relaxed">
            {language === 'hi'
              ? 'आधुनिक जरूरी वस्तुओं के साथ अपनी रोजमर्रा की अलमारी को ऊंचा करें।'
              : 'Elevate your everyday wardrobe with modern essentials.'
            }
          </p>
          {/* Decorative line */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-[#D4B978]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#722F37]" />
            <div className="h-px w-12 bg-[#D4B978]" />
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {mensCategories.map((category, index) => (
            <Link
              key={category.id}
              href={category.link}
              className="group block"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.14)] transition-all duration-500 hover:-translate-y-1">

                {/* Image — portrait 3:4 ratio */}
                <div className="relative aspect-[3/4] overflow-hidden bg-[#F0EDE8]">
                  <div
                    className="absolute inset-0 bg-cover bg-top transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                    style={{ backgroundImage: `url(${category.bgImage})` }}
                  />
                  {/* Subtle vignette on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Hover CTA overlay — fades in on hover */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center pb-5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
                    <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white/95 backdrop-blur-sm text-[#1A1A1A] text-[11px] font-semibold tracking-[0.15em] uppercase rounded-full shadow-md">
                      {language === 'hi' ? 'अभी खरीदें' : 'Shop Now'}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Card Text */}
                <div className="px-5 py-5">
                  <h3
                    className="text-[1.05rem] font-semibold text-[#1A1A1A] mb-1.5 tracking-tight group-hover:text-[#722F37] transition-colors duration-300"
                    style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
                  >
                    {language === 'hi' ? category.nameHi : category.name}
                  </h3>
                  <p className="text-[13px] text-[#8A8A8A] font-light leading-snug">
                    {language === 'hi' ? category.descriptionHi : category.description}
                  </p>

                  {/* Inline CTA — always visible */}
                  <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold tracking-[0.12em] uppercase text-[#722F37] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>{language === 'hi' ? 'देखें' : 'Explore'}</span>
                    <svg className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-14 md:mt-18">
          <Link
            href="/mens"
            className="inline-flex items-center gap-3 px-10 py-4 border border-[#1A1A1A] text-[#1A1A1A] text-[11px] font-semibold tracking-[0.2em] uppercase rounded-full hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 hover:shadow-lg group"
          >
            {language === 'hi' ? "पूरा पुरुष कलेक्शन देखें" : "View Full Men's Collection"}
            <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
