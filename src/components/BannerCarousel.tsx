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
    bgGradient: 'from-blue-50 via-slate-50 to-blue-50',
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
    bgGradient: 'from-pink-50 via-rose-50 to-pink-50',
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
    bgGradient: 'from-purple-50 via-violet-50 to-purple-50',
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
    bgGradient: 'from-amber-50 via-orange-50 to-amber-50',
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
    bgGradient: 'from-red-50 via-pink-50 to-red-50',
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
    <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden bg-[#FAF7F2]">
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
                  {/* Light Overlay for subtle effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-white/10 to-white/5"></div>
                </>
              ) : (
                <>
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgGradient}`}></div>
                  {/* Subtle Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 2px 2px, #722F37 1px, transparent 0)',
                      backgroundSize: '48px 48px'
                    }}></div>
                  </div>
                </>
              )}
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-3xl">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm border border-[#E8E2D9] rounded-full text-sm font-medium text-[#722F37] mb-6 animate-fade-in shadow-md">
                    <span className="text-xl">{banner.icon}</span>
                    <span className="tracking-wide">{language === 'hi' ? 'नया संग्रह' : 'NEW COLLECTION'}</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#2D2D2D] leading-tight mb-6 animate-fade-in" style={{
                    fontFamily: 'var(--font-playfair), Playfair Display, serif',
                    animationDelay: '200ms'
                  }}>
                    {language === 'hi' ? banner.titleHi : banner.title}
                  </h1>

                  {/* Subtitle */}
                  <p className="text-xl md:text-2xl text-[#6B6B6B] mb-10 leading-relaxed font-light animate-fade-in" style={{
                    animationDelay: '400ms'
                  }}>
                    {language === 'hi' ? banner.subtitleHi : banner.subtitle}
                  </p>

                  {/* CTA Button */}
                  <div className="animate-fade-in" style={{ animationDelay: '600ms' }}>
                    <Link
                      href={banner.link}
                      className="group inline-flex items-center gap-3 px-8 py-4 bg-[#722F37] text-white font-semibold rounded-full hover:bg-[#5A252C] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
        className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm hover:bg-white border border-[#E8E2D9] rounded-full flex items-center justify-center transition-all duration-300 group shadow-md"
        aria-label="Previous"
      >
        <svg className="w-6 h-6 text-[#722F37] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm hover:bg-white border border-[#E8E2D9] rounded-full flex items-center justify-center transition-all duration-300 group shadow-md"
        aria-label="Next"
      >
        <svg className="w-6 h-6 text-[#722F37] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                ? 'w-10 h-2 bg-[#722F37]'
                : 'w-2 h-2 bg-[#722F37]/40 hover:bg-[#722F37]/60'
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
