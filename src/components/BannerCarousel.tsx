'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCategories, type CategoryNode } from '@/hooks/useCategories';

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
  catKeyword?: string; // used to find matching L1 category slug dynamically
}

const banners: Banner[] = [
  {
    id: 'welcome',
    title: 'Your Style,\nYour Story',
    titleHi: 'आपकी शैली,\nआपकी कहानी',
    subtitle: 'Premium Fashion for Everyone',
    subtitleHi: 'हर किसी के लिए प्रीमियम फैशन',
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
    catKeyword: 'men',
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
    catKeyword: 'women',
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
    catKeyword: 'saree',
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
    catKeyword: 'kid',
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
    catKeyword: 'beauty',
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
    catKeyword: 'footwear',
  },
];

// Match a category node by keyword — checks that name/slug STARTS WITH the
// keyword so that "men" does not accidentally match "women".
function matchesCatKeyword(node: CategoryNode, kw: string): boolean {
  const name = node.name.toLowerCase();
  const slug = node.slug.toLowerCase();
  const k = kw.toLowerCase();
  return name.startsWith(k) || slug.startsWith(k);
}

// Resolves the banner link to a live category-tree page when possible.
function getBannerLink(banner: Banner, tree: CategoryNode[]): string {
  if (!banner.catKeyword || tree.length === 0) return banner.link;
  const match = tree.find((node) => matchesCatKeyword(node, banner.catKeyword!));
  return match ? `/category/${match.slug}` : banner.link;
}

export default function BannerCarousel() {
  const { language } = useLanguage();
  const { tree, loading } = useCategories();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  // Key increments each time a slide becomes active — forces animation classes to restart
  const [slideKey, setSlideKey] = useState(0);

  // Only show category banners whose L1 category exists in the live tree.
  // Welcome banner (no catKeyword) always shows.
  // While the tree is still loading, show only the welcome banner to avoid flicker.
  const visibleBanners = loading
    ? banners.filter((b) => !b.catKeyword)
    : banners.filter((b) => {
        if (!b.catKeyword) return true;
        return tree.some((node) => matchesCatKeyword(node, b.catKeyword!));
      });

  // Clamp currentSlide whenever visibleBanners length shrinks
  useEffect(() => {
    if (currentSlide >= visibleBanners.length) {
      setCurrentSlide(0);
    }
  }, [visibleBanners.length, currentSlide]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % visibleBanners.length);
      setSlideKey((k) => k + 1);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, visibleBanners.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setSlideKey((k) => k + 1);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % visibleBanners.length);
  const prevSlide = () => goToSlide((currentSlide - 1 + visibleBanners.length) % visibleBanners.length);

  return (
    <section className="relative w-full">
      <div className="relative h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden">

        {visibleBanners.map((banner, index) => {
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
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15 pointer-events-none" />
              {/* Bottom fade for indicator readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              {/* Clickable text area */}
              <Link href={getBannerLink(banner, tree)} className="absolute inset-0">
                <div className="h-full flex flex-col justify-center pl-8 sm:pl-14 lg:pl-24 pr-8 max-w-3xl">

                  {/* Collection tag */}
                  <span
                    key={`tag-${slideKey}-${banner.id}`}
                    className={`banner-cta text-[10px] sm:text-[11px] text-white/65 tracking-[0.3em] uppercase mb-4 font-medium ${isActive ? '' : 'opacity-0'}`}
                  >
                    {language === 'hi' ? banner.tagHi : banner.tag}
                  </span>

                  {/* Heading — brand maroon with strong shadow for contrast on photo backgrounds */}
                  <h2
                    key={`title-${slideKey}-${banner.id}`}
                    className={`banner-title text-[3.2rem] sm:text-[4rem] md:text-[4.8rem] font-semibold text-[#722F37] leading-[1.04] mb-5 whitespace-pre-line tracking-[-0.02em] ${isActive ? '' : 'opacity-0'}`}
                    style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif', textShadow: '0 0 40px rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.4)' }}
                  >
                    {language === 'hi' ? banner.titleHi : banner.title}
                  </h2>

                  {/* Subtitle */}
                  <p
                    key={`sub-${slideKey}-${banner.id}`}
                    className={`banner-subtitle text-[1rem] sm:text-[1.15rem] text-white/80 font-light tracking-[0.04em] max-w-md ${isActive ? '' : 'opacity-0'}`}
                  >
                    {language === 'hi' ? banner.subtitleHi : banner.subtitle}
                  </p>
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
          {visibleBanners.map((_, index) => (
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
