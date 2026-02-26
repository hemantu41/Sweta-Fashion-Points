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
  link: string;
  bgGradient: string;
  bgImage: string; // Background image URL
}

const banners: Banner[] = [
  {
    id: 'welcome',
    title: 'Your Style, Your Story',
    titleHi: 'आपकी शैली, आपकी कहानी',
    subtitle: 'Amas, Gaya, Bihar | fashionpoints.co.in',
    subtitleHi: 'अमास, गया, बिहार | fashionpoints.co.in',
    link: '/',
    bgGradient: 'from-purple-50 via-pink-50 to-rose-50',
    bgImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&h=600&fit=crop&q=90',
  },
  {
    id: 'mens',
    title: "Men's Collection",
    titleHi: 'पुरुषों का कलेक्शन',
    subtitle: 'Redefine your style with premium fashion',
    subtitleHi: 'प्रीमियम फैशन के साथ अपनी शैली को फिर से परिभाषित करें',
    link: '/mens',
    bgGradient: 'from-blue-50 via-slate-50 to-blue-50',
    bgImage: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1600&h=600&fit=crop&q=90',
  },
  {
    id: 'womens',
    title: "Women's Collection",
    titleHi: 'महिलाओं का कलेक्शन',
    subtitle: 'Elegance that speaks volumes',
    subtitleHi: 'लालित्य जो बहुत कुछ कहता है',
    link: '/womens',
    bgGradient: 'from-pink-50 via-rose-50 to-pink-50',
    bgImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600&h=600&fit=crop&q=90',
  },
  {
    id: 'sarees',
    title: 'Exquisite Sarees',
    titleHi: 'शानदार साड़ियां',
    subtitle: 'Where tradition meets contemporary grace',
    subtitleHi: 'जहां परंपरा समकालीन अनुग्रह से मिलती है',
    link: '/sarees',
    bgGradient: 'from-purple-50 via-violet-50 to-purple-50',
    bgImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&h=600&fit=crop&q=90',
  },
  {
    id: 'kids',
    title: "Kids Collection",
    titleHi: 'बच्चों का कलेक्शन',
    subtitle: 'Playful styles for little fashionistas',
    subtitleHi: 'छोटे फैशनिस्टा के लिए खिलंडी शैली',
    link: '/kids',
    bgGradient: 'from-amber-50 via-orange-50 to-amber-50',
    bgImage: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1600&h=600&fit=crop&q=90',
  },
  {
    id: 'beauty',
    title: 'Beauty & Makeup',
    titleHi: 'ब्यूटी और मेकअप',
    subtitle: 'Radiate confidence with premium beauty',
    subtitleHi: 'प्रीमियम ब्यूटी के साथ आत्मविश्वास बिखेरें',
    link: '/makeup',
    bgGradient: 'from-red-50 via-pink-50 to-red-50',
    bgImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&h=600&fit=crop&q=90',
  },
  {
    id: 'footwear',
    title: 'Footwear Collection',
    titleHi: 'फुटवियर कलेक्शन',
    subtitle: 'Step into style with premium footwear',
    subtitleHi: 'प्रीमियम फुटवियर के साथ स्टाइल में कदम रखें',
    link: '/footwear',
    bgGradient: 'from-gray-50 via-slate-50 to-gray-50',
    bgImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&h=600&fit=crop&q=90',
  },
];

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
    <section className="relative w-full py-12 bg-[#FAF7F2]">
      <div className="max-w-[95%] mx-auto px-4">
        <div className="relative h-[450px] md:h-[550px] overflow-hidden rounded-2xl shadow-2xl">
        {banners.map((banner, index) => (
          <Link
            key={banner.id}
            href={banner.link}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out cursor-pointer group ${
              index === currentSlide
                ? 'opacity-100 z-10'
                : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${banner.bgImage})` }}
              ></div>
              {/* Soft Overlay for better text readability - reduced opacity for less contrast */}
              <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgGradient} opacity-60`}></div>
              {/* Subtle vignette effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl">
                  {/* Title */}
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#2D2D2D] leading-tight mb-6 animate-fade-in drop-shadow-lg" style={{
                    fontFamily: 'var(--font-playfair), Playfair Display, serif'
                  }}>
                    {language === 'hi' ? banner.titleHi : banner.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-xl md:text-2xl text-[#2D2D2D] mb-10 leading-relaxed font-medium animate-fade-in drop-shadow-md" style={{
                    animationDelay: '200ms'
                  }}>
                    {language === 'hi' ? banner.subtitleHi : banner.subtitle}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Navigation - Minimal & Premium */}
        <button
          onClick={prevSlide}
          className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white border border-[#E8E2D9] rounded-full flex items-center justify-center transition-all duration-300 group shadow-lg hover:shadow-xl"
          aria-label="Previous"
        >
          <svg className="w-6 h-6 text-[#722F37] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/90 backdrop-blur-sm hover:bg-white border border-[#E8E2D9] rounded-full flex items-center justify-center transition-all duration-300 group shadow-lg hover:shadow-xl"
          aria-label="Next"
        >
          <svg className="w-6 h-6 text-[#722F37] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots - Clean & Minimal */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? 'w-10 h-2 bg-[#722F37]'
                  : 'w-2 h-2 bg-[#722F37]/40 hover:bg-[#722F37]/60'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
