'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface SareeCategory {
  id: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  link: string;
  bgImage: string;
}

// All images: on-model editorial style — consistent portrait orientation
const sareeCategories: SareeCategory[] = [
  {
    id: 'daily',
    name: 'Daily Wear',
    nameHi: 'डेली वियर',
    description: 'Everyday elegance, effortlessly draped',
    descriptionHi: 'रोजमर्रा की सुंदरता, आसानी से',
    link: '/sarees?category=daily',
    bgImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1067&fit=crop&crop=top&q=90',
  },
  {
    id: 'party',
    name: 'Party Wear',
    nameHi: 'पार्टी वियर',
    description: 'Glamorous drapes for every celebration',
    descriptionHi: 'हर उत्सव के लिए ग्लैमरस साड़ी',
    link: '/sarees?category=party',
    bgImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e51f2?w=800&h=1067&fit=crop&crop=top&q=90',
  },
  {
    id: 'wedding',
    name: 'Bridal',
    nameHi: 'दुल्हन',
    description: 'Exquisite craftsmanship for your big day',
    descriptionHi: 'आपके खास दिन के लिए बेहतरीन कारीगरी',
    link: '/sarees?category=wedding',
    bgImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=1067&fit=crop&crop=top&q=90',
  },
  {
    id: 'festival',
    name: 'Festive',
    nameHi: 'त्योहार',
    description: 'Vibrant hues for every occasion',
    descriptionHi: 'हर अवसर के लिए जीवंत रंग',
    link: '/sarees?category=festival',
    bgImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&h=1067&fit=crop&crop=top&q=90',
  },
];

// Shared filter — sarees have rich colours; slightly less desaturation to preserve vibrancy
const PHOTO_FILTER = 'saturate(0.90) contrast(1.05) brightness(0.95)';

export default function SareesCollectionSection() {
  const { language } = useLanguage();

  return (
    <section className="py-24 md:py-32 bg-[#FAFAFA]">
      <div className="max-w-[1300px] mx-auto px-6 sm:px-8 lg:px-14">

        {/* Section Header — split: title left, View All right */}
        <div className="mb-16 md:mb-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <span className="block text-[10px] tracking-[0.38em] uppercase text-[#ADADAD] font-medium mb-4">
              {language === 'hi' ? 'भारतीय परिधान' : 'Indian Heritage'}
            </span>
            <h2
              className="text-[2.2rem] sm:text-[2.8rem] md:text-[3.2rem] font-semibold text-[#1A1A1A] tracking-[-0.025em] leading-none"
              style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
            >
              {language === 'hi' ? 'साड़ियों का संग्रह' : 'Sarees Collection'}
            </h2>
            <p className="mt-3 text-[13px] text-[#ADADAD] font-light tracking-wide max-w-xs leading-relaxed">
              {language === 'hi'
                ? 'परंपरा और आधुनिक सुंदरता का अनूठा संगम।'
                : 'Where tradition meets contemporary grace.'
              }
            </p>
          </div>

          {/* View All — desktop top-right, minimal arrow */}
          <Link
            href="/sarees"
            className="hidden sm:inline-flex items-center gap-2.5 text-[10px] tracking-[0.2em] uppercase text-[#1A1A1A] font-semibold border-b border-[#C8C8C8] pb-0.5 hover:border-[#722F37] hover:text-[#722F37] transition-colors duration-250 self-end mb-1 whitespace-nowrap group"
          >
            {language === 'hi' ? 'सभी देखें' : 'View All'}
            <svg className="w-2.5 h-2.5 stroke-1 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Category Grid — no card containers, wide gutters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14 md:gap-x-10 lg:gap-x-12">
          {sareeCategories.map((category) => (
            <Link
              key={category.id}
              href={category.link}
              className="group block"
            >
              {/* Image — sharp rectangle, consistent CSS filter */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[#EDE8E3]">

                {/* Photo with shared filter */}
                <div
                  className="absolute inset-0 bg-cover bg-top transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  style={{
                    backgroundImage: `url(${category.bgImage})`,
                    filter: PHOTO_FILTER,
                  }}
                />

                {/* Subtle dark overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/28 transition-colors duration-400" />

                {/* Ghost button — 1px white border, fades in centered */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-350">
                  <span className="border border-white/85 text-white text-[9.5px] font-semibold tracking-[0.26em] uppercase px-6 py-3 backdrop-blur-[2px]">
                    {language === 'hi' ? 'अभी खरीदें' : 'Shop Now'}
                  </span>
                </div>
              </div>

              {/* Text — left-flush on page background */}
              <div className="mt-4">
                <h3 className="text-[11px] sm:text-[11.5px] font-semibold text-[#1A1A1A] tracking-[0.22em] uppercase leading-snug group-hover:text-[#722F37] transition-colors duration-250">
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
            href="/sarees"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 border border-[#1A1A1A] text-[#1A1A1A] text-[10px] font-semibold tracking-[0.22em] uppercase hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 group"
          >
            {language === 'hi' ? 'पूरा संग्रह देखें' : 'View Full Collection'}
            <svg className="w-2.5 h-2.5 stroke-1 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  );
}
