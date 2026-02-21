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
  buttonText: string;
  buttonTextHi: string;
  link: string;
  bgGradient: string;
  icon: string;
  bgImage?: string; // Optional background image
}

const banners: Banner[] = [
  {
    id: 'mens',
    title: "Men's Collection",
    titleHi: 'पुरुषों का कलेक्शन',
    subtitle: 'Redefine your style with premium fashion',
    subtitleHi: 'प्रीमियम फैशन के साथ अपनी शैली को फिर से परिभाषित करें',
    buttonText: 'Explore Collection',
    buttonTextHi: 'कलेक्शन देखें',
    link: '/mens',
    bgGradient: 'from-slate-900 via-gray-800 to-slate-900',
    icon: '👔',
  },
  {
    id: 'womens',
    title: "Women's Collection",
    titleHi: 'महिलाओं का कलेक्शन',
    subtitle: 'Elegance that speaks volumes',
    subtitleHi: 'लालित्य जो बहुत कुछ कहता है',
    buttonText: 'Discover Styles',
    buttonTextHi: 'स्टाइल्स खोजें',
    link: '/womens',
    bgGradient: 'from-rose-900 via-pink-800 to-rose-900',
    icon: '👗',
  },
  {
    id: 'sarees',
    title: 'Exquisite Sarees',
    titleHi: 'शानदार साड़ियां',
    subtitle: 'Where tradition meets contemporary grace',
    subtitleHi: 'जहां परंपरा समकालीन अनुग्रह से मिलती है',
    buttonText: 'View Sarees',
    buttonTextHi: 'साड़ियां देखें',
    link: '/sarees',
    bgGradient: 'from-purple-900 via-violet-800 to-purple-900',
    icon: '🥻',
  },
  {
    id: 'kids',
    title: "Kids Collection",
    titleHi: 'बच्चों का कलेक्शन',
    subtitle: 'Playful styles for little fashionistas',
    subtitleHi: 'छोटे फैशनिस्टा के लिए खिलंडी शैली',
    buttonText: 'Shop Kids',
    buttonTextHi: 'बच्चों के लिए खरीदें',
    link: '/kids',
    bgGradient: 'from-amber-600 via-orange-600 to-amber-600',
    icon: '👶',
  },
  {
    id: 'beauty',
    title: 'Beauty & Makeup',
    titleHi: 'ब्यूटी और मेकअप',
    subtitle: 'Radiate confidence with premium beauty',
    subtitleHi: 'प्रीमियम ब्यूटी के साथ आत्मविश्वास बिखेरें',
    buttonText: 'Explore Beauty',
    buttonTextHi: 'ब्यूटी देखें',
    link: '/makeup',
    bgGradient: 'from-red-800 via-pink-700 to-red-800',
    icon: '💄',
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
    <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden bg-gray-900">
      {/* Slides */}
      <div className="relative h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide
                ? 'opacity-100 z-10'
                : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image or Gradient */}
            <div className="absolute inset-0">
              {banner.bgImage ? (
                <>
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${banner.bgImage})` }}
                  ></div>
                  {/* Dark Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/50"></div>
                </>
              ) : (
                <>
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgGradient}`}></div>
                  {/* Overlay Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                      backgroundSize: '48px 48px'
                    }}></div>
                  </div>
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
                </>
              )}
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium text-white mb-6 animate-fade-in">
                    <span className="text-xl">{banner.icon}</span>
                    <span className="tracking-wide">{language === 'hi' ? 'नया संग्रह' : 'NEW COLLECTION'}</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in" style={{
                    fontFamily: 'var(--font-playfair), Playfair Display, serif',
                    animationDelay: '200ms',
                    textShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}>
                    {language === 'hi' ? banner.titleHi : banner.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed font-light animate-fade-in" style={{
                    animationDelay: '400ms',
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    {language === 'hi' ? banner.subtitleHi : banner.subtitle}
                  </p>

                  {/* CTA Button */}
                  <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
                    <Link
                      href={banner.link}
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-white/20 transform hover:scale-105"
                    >
                      <span className="tracking-wide">{language === 'hi' ? banner.buttonTextHi : banner.buttonText}</span>
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation - Minimal & Premium */}
      <button
        onClick={prevSlide}
        className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all duration-300 group"
        aria-label="Previous"
      >
        <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-all duration-300 group"
        aria-label="Next"
      >
        <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots - Clean & Minimal */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? 'w-10 h-2 bg-white'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
