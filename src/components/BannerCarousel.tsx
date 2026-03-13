'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

type TextPosition = 'left' | 'right' | 'center';

interface Banner {
  id: string;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  link: string;
  bgImage: string;
  position: TextPosition; // where to place text based on photo negative space
}

const banners: Banner[] = [
  {
    id: 'welcome',
    title: 'Your Style,\nYour Story',
    titleHi: 'आपकी शैली,\nआपकी कहानी',
    subtitle: 'Amas, Gaya, Bihar',
    subtitleHi: 'अमास, गया, बिहार',
    link: '/',
    bgImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&h=700&fit=crop&q=90',
    position: 'left',
  },
  {
    id: 'mens',
    title: "Men's\nCollection",
    titleHi: 'पुरुषों का\nकलेक्शन',
    subtitle: 'Redefine your style',
    subtitleHi: 'अपनी शैली को नया रूप दें',
    link: '/mens',
    bgImage: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1600&h=700&fit=crop&q=90',
    position: 'right',
  },
  {
    id: 'womens',
    title: "Women's\nCollection",
    titleHi: 'महिलाओं का\nकलेक्शन',
    subtitle: 'Elegance that speaks volumes',
    subtitleHi: 'लालित्य जो बहुत कुछ कहता है',
    link: '/womens',
    bgImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&h=700&fit=crop&q=90',
    position: 'left',
  },
  {
    id: 'sarees',
    title: 'Exquisite\nSarees',
    titleHi: 'शानदार\nसाड़ियां',
    subtitle: 'Tradition meets contemporary grace',
    subtitleHi: 'परंपरा और आधुनिक सौंदर्य का संगम',
    link: '/sarees',
    bgImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&h=700&fit=crop&q=90',
    position: 'right',
  },
  {
    id: 'kids',
    title: "Kids\nCollection",
    titleHi: 'बच्चों का\nकलेक्शन',
    subtitle: 'Playful styles for little ones',
    subtitleHi: 'छोटों के लिए खिलंडी शैली',
    link: '/kids',
    bgImage: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&h=700&fit=crop&q=90',
    position: 'left',
  },
  {
    id: 'beauty',
    title: 'Beauty &\nMakeup',
    titleHi: 'ब्यूटी और\nमेकअप',
    subtitle: 'Radiate confidence',
    subtitleHi: 'आत्मविश्वास बिखेरें',
    link: '/makeup',
    bgImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&h=700&fit=crop&q=90',
    position: 'right',
  },
  {
    id: 'footwear',
    title: 'Footwear\nCollection',
    titleHi: 'फुटवियर\nकलेक्शन',
    subtitle: 'Step into style',
    subtitleHi: 'स्टाइल में कदम रखें',
    link: '/footwear',
    bgImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&h=700&fit=crop&q=90',
    position: 'left',
  },
];

const positionClasses: Record<TextPosition, string> = {
  left: 'items-start text-left pl-10 sm:pl-16 lg:pl-24',
  right: 'items-end text-right pr-10 sm:pr-16 lg:pr-24',
  center: 'items-center text-center px-8',
};

export default function BannerCarousel() {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % banners.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + banners.length) % banners.length);

  return (
    /* Full-bleed: no outer padding, no rounded corners, no shadow */
    <section className="relative w-full">
      <div className="relative h-[480px] sm:h-[580px] md:h-[680px] overflow-hidden">
        {banners.map((banner, index) => (
          <Link
            key={banner.id}
            href={banner.link}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Raw photography — no overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.bgImage})` }}
            />

            {/* Very subtle bottom gradient — only for dot legibility, not for text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

            {/* Text — positioned per banner, white, no shadow */}
            <div className={`relative h-full flex flex-col justify-end pb-16 ${positionClasses[banner.position]}`}>
              <div className="max-w-sm">
                <h2
                  className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white leading-tight mb-3 whitespace-pre-line"
                  style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
                >
                  {language === 'hi' ? banner.titleHi : banner.title}
                </h2>
                <p className="text-sm sm:text-base text-white/80 mb-5 font-light tracking-wide">
                  {language === 'hi' ? banner.subtitleHi : banner.subtitle}
                </p>
                <span className="inline-block text-xs text-white uppercase tracking-widest border-b border-white/60 pb-0.5 hover:border-white transition-colors">
                  {language === 'hi' ? 'अभी खरीदें' : 'Shop Now'}
                </span>
              </div>
            </div>
          </Link>
        ))}

        {/* Prev / Next — square, minimal */}
        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/15 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-200"
          aria-label="Previous"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-white/15 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-200"
          aria-label="Next"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Progress indicators — thin lines instead of dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-0.5 transition-all duration-500 ${
                index === currentSlide ? 'w-8 bg-white' : 'w-4 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
