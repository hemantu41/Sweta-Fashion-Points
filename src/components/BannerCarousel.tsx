'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface Banner {
  id: string;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  tag: string;
  tagHi: string;
  link: string;
  bgImage: string;
}

const banners: Banner[] = [
  {
    id: 'welcome',
    title: 'Your Style,\nYour Story',
    titleHi: 'आपकी शैली,\nआपकी कहानी',
    subtitle: 'Amas, Gaya, Bihar',
    subtitleHi: 'अमास, गया, बिहार',
    tag: 'Welcome',
    tagHi: 'स्वागत',
    link: '/',
    bgImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&h=700&fit=crop&q=90',
  },
  {
    id: 'mens',
    title: "Men's\nCollection",
    titleHi: 'पुरुषों का\nकलेक्शन',
    subtitle: 'Redefine your style',
    subtitleHi: 'अपनी शैली को नया रूप दें',
    tag: "Men's",
    tagHi: 'पुरुष',
    link: '/mens',
    bgImage: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1600&h=700&fit=crop&q=90',
  },
  {
    id: 'womens',
    title: "Women's\nCollection",
    titleHi: 'महिलाओं का\nकलेक्शन',
    subtitle: 'Elegance that speaks volumes',
    subtitleHi: 'लालित्य जो बहुत कुछ कहता है',
    tag: "Women's",
    tagHi: 'महिला',
    link: '/womens',
    bgImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&h=700&fit=crop&q=90',
  },
  {
    id: 'sarees',
    title: 'Exquisite\nSarees',
    titleHi: 'शानदार\nसाड़ियां',
    subtitle: 'Tradition meets contemporary grace',
    subtitleHi: 'परंपरा और आधुनिक सौंदर्य का संगम',
    tag: 'Sarees',
    tagHi: 'साड़ी',
    link: '/sarees',
    bgImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&h=700&fit=crop&q=90',
  },
  {
    id: 'kids',
    title: "Kids\nCollection",
    titleHi: 'बच्चों का\nकलेक्शन',
    subtitle: 'Playful styles for little ones',
    subtitleHi: 'छोटों के लिए खिलंडी शैली',
    tag: "Kids",
    tagHi: 'बच्चे',
    link: '/kids',
    bgImage: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&h=700&fit=crop&q=90',
  },
  {
    id: 'beauty',
    title: 'Beauty &\nMakeup',
    titleHi: 'ब्यूटी और\nमेकअप',
    subtitle: 'Radiate confidence',
    subtitleHi: 'आत्मविश्वास बिखेरें',
    tag: 'Beauty',
    tagHi: 'ब्यूटी',
    link: '/makeup',
    bgImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&h=700&fit=crop&q=90',
  },
  {
    id: 'footwear',
    title: 'Footwear\nCollection',
    titleHi: 'फुटवियर\nकलेक्शन',
    subtitle: 'Step into style',
    subtitleHi: 'स्टाइल में कदम रखें',
    tag: 'Footwear',
    tagHi: 'जूते',
    link: '/footwear',
    bgImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&h=700&fit=crop&q=90',
  },
];

export default function BannerCarousel() {
  const { language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  // Key increments each time a slide becomes active — forces animation classes to restart
  const [slideKey, setSlideKey] = useState(0);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
      setSlideKey((k) => k + 1);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setSlideKey((k) => k + 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % banners.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + banners.length) % banners.length);

  return (
    <section className="relative w-full">
      <div className="relative h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden">

        {banners.map((banner, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Background image — Ken Burns zoom only on active slide */}
              <div
                key={isActive ? `active-${slideKey}` : `idle-${banner.id}`}
                className={`absolute inset-0 bg-cover bg-center ${isActive ? 'animate-ken-burns' : ''}`}
                style={{ backgroundImage: `url(${banner.bgImage})` }}
              />

              {/* Dark gradient — left-heavy for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/10 pointer-events-none" />
              {/* Bottom fade for indicator readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Clickable text area */}
              <Link href={banner.link} className="absolute inset-0">
                <div className="h-full flex flex-col justify-center pl-8 sm:pl-14 lg:pl-24 pr-8 max-w-3xl">

                  {/* Collection tag */}
                  <span
                    key={`tag-${slideKey}-${banner.id}`}
                    className={`banner-cta text-[10px] sm:text-[11px] text-white/65 tracking-[0.3em] uppercase mb-4 font-medium ${isActive ? '' : 'opacity-0'}`}
                  >
                    {language === 'hi' ? banner.tagHi : banner.tag}
                  </span>

                  {/* Heading */}
                  <h2
                    key={`title-${slideKey}-${banner.id}`}
                    className={`banner-title text-[3.2rem] sm:text-[4rem] md:text-[4.8rem] font-semibold text-white leading-[1.04] mb-5 whitespace-pre-line tracking-[-0.02em] ${isActive ? '' : 'opacity-0'}`}
                    style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
                  >
            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl">
                  {/* Title */}
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in drop-shadow-lg" style={{
                    fontFamily: 'var(--font-playfair), Playfair Display, serif'
                  }}>
                    {language === 'hi' ? banner.titleHi : banner.title}
                  </h2>

                  {/* Subtitle */}
                  <p
                    key={`sub-${slideKey}-${banner.id}`}
                    className={`banner-subtitle text-[1rem] sm:text-[1.15rem] text-white/80 mb-8 font-light tracking-[0.04em] max-w-md ${isActive ? '' : 'opacity-0'}`}
                  >
                  <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed font-medium animate-fade-in drop-shadow-md" style={{
                    animationDelay: '200ms'
                  }}>
                    {language === 'hi' ? banner.subtitleHi : banner.subtitle}
                  </p>

                  {/* CTA button — rounded, brand color, hover animation */}
                  <span
                    key={`cta-${slideKey}-${banner.id}`}
                    className={`banner-cta self-start inline-flex items-center gap-2.5 px-8 py-3.5 bg-white text-[#1A1A1A] text-[11px] font-semibold tracking-[0.18em] uppercase rounded-full shadow-lg transition-all duration-300 hover:bg-[#722F37] hover:text-white hover:shadow-xl hover:-translate-y-0.5 ${isActive ? '' : 'opacity-0'}`}
                  >
                    {language === 'hi' ? 'अभी खरीदें' : 'Shop Now'}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            </div>
          );
        })}

        {/* Prev arrow — circular glassmorphism */}
        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-7 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all duration-300 hover:bg-white/40 hover:scale-110 hover:border-white/60 group"
          aria-label="Previous"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Next arrow — circular glassmorphism */}
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-7 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center transition-all duration-300 hover:bg-white/40 hover:scale-110 hover:border-white/60 group"
          aria-label="Next"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Progress indicators — aligned with text left padding */}
        <div className="absolute bottom-6 left-8 sm:left-14 lg:left-24 z-30 flex gap-2 items-center">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-[2px] transition-all duration-500 rounded-full ${
                index === currentSlide ? 'w-10 bg-white' : 'w-5 bg-white/35 hover:bg-white/55'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
